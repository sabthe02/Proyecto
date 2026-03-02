package com.Proyecto.SpringBoot.Logica;

import java.util.Dictionary;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.JugadoresDAO;
import com.Proyecto.SpringBoot.Logica.DTO.DronAereoDTO;
import com.Proyecto.SpringBoot.Logica.DTO.DronNavalDTO;
import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;
import com.Proyecto.SpringBoot.Logica.DTO.JugadorDTO;
import com.Proyecto.SpringBoot.Logica.DTO.MapaDTO;
import com.Proyecto.SpringBoot.Logica.DTO.PortaDronAereoDTO;
import com.Proyecto.SpringBoot.Logica.DTO.PortaDronNavalDTO;
import com.Proyecto.SpringBoot.Logica.Excepciones.AccionInvalidaException;
import com.Proyecto.SpringBoot.Logica.Excepciones.ExisteNickNameException;
import com.Proyecto.SpringBoot.Logica.Excepciones.JugadorNoExisteException;
import com.Proyecto.SpringBoot.Logica.Excepciones.LobbyException;
import com.Proyecto.SpringBoot.Modelos.Jugador;

@Service
public class Fachada implements iFachada {

    private Timer timerLobby;

    @Autowired
    private JugadoresDAO jugadoresDAO;

    //Dado un id de usuario obtenermos el jugador.
    Dictionary<String, Jugador> usuariosConectados;

    //Dado un id de usuario, se obtiene el jugador en el Lobby.
    Map<String, Jugador> jugadoresEnLobby;

    //Dado un id de usuario, se obtiene la sesion en la que esta el jugador.
    Map<String, String> jugadorEnSesion;

    //Dado el id de una sesion, se obtiene la sesion de juego.
    Map<String, SesionJuego> sesionesActivas;

    iHandler handler;

    public Fachada() {

        usuariosConectados = new java.util.Hashtable<>();
        jugadoresEnLobby = new java.util.Hashtable<>();
        jugadorEnSesion = new java.util.Hashtable<>();
        sesionesActivas = new java.util.Hashtable<>();
        this.timerLobby = new Timer();
        this.iniciarTimer();
    }

    public void iniciarTimer() {
        TimerTask tarea = new TimerTask() {
            @Override
            public void run() {
                // Llama al método de la clase
                ActualizarLobby();
            }
        };

        // Ejecutar después de 1 segundo, luego cada 3 segundos
        timerLobby.schedule(tarea, 1000, 3000);
    }

    public void ActualizarLobby() {

        while (sesionesActivas.size() < 10 && jugadoresEnLobby.size() > 1) {

            List<Jugador> jugadoresParaSesion = new java.util.ArrayList<>();
            String idSesion = "Sesion-" + System.currentTimeMillis();

            for(int i = 0; i < 2; i++) {
                String key1 = (String) jugadoresEnLobby.keySet().toArray()[0];
                jugadoresParaSesion.add(jugadoresEnLobby.remove(key1));
                jugadorEnSesion.put(key1, idSesion);
            }

            asegurarEquiposOpuestos(jugadoresParaSesion);

            SesionJuego nuevaSesion = new SesionJuego(idSesion, jugadoresParaSesion, this);
            sesionesActivas.put(nuevaSesion.getIdSesion(), nuevaSesion);

            nuevaSesion.iniciarSesion();
        }
    }
// Sabine: puse esto porque no me estaba andando el matcheo de los equipoos
    private void asegurarEquiposOpuestos(List<Jugador> jugadoresParaSesion) {
        if (jugadoresParaSesion == null || jugadoresParaSesion.size() < 2) {
            return;
        }

        Jugador jugador1 = jugadoresParaSesion.get(0);
        Jugador jugador2 = jugadoresParaSesion.get(1);
        if (jugador1 == null || jugador2 == null) {
            return;
        }

        String team1 = normalizarTeam(jugador1.getTeam());
        String team2 = normalizarTeam(jugador2.getTeam());

        if (("AEREO".equals(team1) && "NAVAL".equals(team2)) || ("NAVAL".equals(team1) && "AEREO".equals(team2))) {
            return;
        }

        jugador1.setTeam("AEREO");
        jugador2.setTeam("NAVAL");
        System.out.println("Equipos normalizados para sesion: " + jugador1.getNickName() + "=AEREO, " + jugador2.getNickName() + "=NAVAL");
    }

    private String normalizarTeam(String team) {
        if (team == null) {
            return "";
        }
        return team.trim().toUpperCase();
    }

    public Jugador loginUsuario(String nickName) throws JugadorNoExisteException {

        Jugador jugador = null;
        try {
            jugador = jugadoresDAO.findByNickName(nickName);
        } catch (Exception e) {
            System.err.println("Error al buscar jugador: " + e.getMessage());
        }

        System.err.println("Buscando jugador con nickname: " + nickName);
        if (jugador != null) {
            if (usuariosConectados.get(jugador.getId()) == null) {
                usuariosConectados.put(jugador.getId(), jugador);
            }

            return jugador;
        }

        throw new JugadorNoExisteException("El jugador " + nickName + " no existe");
    }

    public Jugador crearUsuario(String nickName, String team) throws ExisteNickNameException {
        if (jugadoresDAO.findByNickName(nickName) != null) {
            throw new ExisteNickNameException("El NickName " + nickName + " ya existe.");
        }

        Jugador nuevoJugador = new Jugador();

        nuevoJugador.setNickName(nickName);
        nuevoJugador.setTeam(team);
        return jugadoresDAO.save(nuevoJugador);
    }

    public void desconectarUsuario(String jugadorId) {
        usuariosConectados.remove(jugadorId);
        jugadoresEnLobby.remove(jugadorId);
        jugadorEnSesion.remove(jugadorId);
        throw new UnsupportedOperationException("No implementado aun");
    }

    public boolean recuperarPartida() {
        throw new UnsupportedOperationException("No implementado aun");
    }

    public boolean guardarPartida() {
        throw new UnsupportedOperationException("No implementado aun");
    }

    public boolean accion_mover(Jugador jugador, int idElemento, float x, float y, float z, int angulo) throws AccionInvalidaException {
        String sesionId = jugadorEnSesion.get(jugador.getId());
// Sabine metio mano acá para poder testear el Frontend, antes no se validaba que 
// el jugador estuviera en una sesion activa, lo cual hacia que no se aplicaran los movimientos. 
// Ahora se valida que el jugador tenga una sesion activa y que el elemento a mover exista en 
// la sesion. Si alguna de estas condiciones no se cumple, se lanza una AccionInvalidaException 
// con un mensaje descriptivo del error. SI algo está mal, corregir por favor!
        if(sesionId == null) {
            throw new AccionInvalidaException("El jugador no esta en una sesion activa.");
        }
        
        SesionJuego sesion = sesionesActivas.get(sesionId);
        if (sesion == null) {
            throw new AccionInvalidaException("La sesion de juego no existe.");
        }

        Elemento elemento = sesion.getElementosEnJuego().get(idElemento);
        if (elemento == null) {
            throw new AccionInvalidaException("El elemento no existe en la sesion.");
        }

        elemento.setPosicionX(x);
        elemento.setPosicionY(y);
        elemento.setPosicionZ(z);
        elemento.setAngulo(angulo);

        System.out.println("Movimiento aplicado en servidor -> sesion=" + sesionId + " idElemento=" + idElemento + " x=" + x + " y=" + y + " z=" + z + " angulo=" + angulo);

        Evento_Movimiento evento = new Evento_Movimiento(elemento, x, y, angulo);
        List<Evento> acciones = new java.util.ArrayList<>();
        acciones.add(evento);

        List<Jugador> jugadoresSesion = new java.util.ArrayList<>();
        sesion.getElementosJugadores().forEach((jugadorSesion, portaDron) -> {
            jugadoresSesion.add(jugadorSesion);
        });

        boolean actualizado = EnviarActualizaciones(jugadoresSesion, acciones);
        System.out.println("ACTUALIZAR_PARTIDA enviado=" + actualizado + " jugadores=" + jugadoresSesion.size() + " acciones=" + acciones.size());
        return actualizado;
    }

    public boolean accion_disparar(Jugador jugador, int idElemento) throws AccionInvalidaException {
        String sesionId = jugadorEnSesion.get(jugador.getId());

        if(sesionId == null) {
            throw new AccionInvalidaException("El jugador no esta en una sesion activa.");
        }
//Sabine metio mano acá para poder testear el Frontend.
// Antes no se validaba que el jugador estuviera en una sesion activa, 
// lo cual hacia que no se aplicaran los disparos. Hay que cambiar el Thread.sleep(30) que esta mas abajo por un timer 
// Es una simulación esto, luego reemplazar con encolarlo y sea la sesion la que se encargue de procesar el movimiento y el disparo.
        SesionJuego sesion = sesionesActivas.get(sesionId);
        if (sesion == null) {
            throw new AccionInvalidaException("La sesion de juego no existe.");
        }

        Elemento elemento = sesion.getElementosEnJuego().get(idElemento);
        if (!(elemento instanceof Dron)) {
            throw new AccionInvalidaException("El elemento no es un dron valido para disparar.");
        }

        Dron dron = (Dron) elemento;
        if (dron.getJugador() == null || !dron.getJugador().getId().equals(jugador.getId())) {
            throw new AccionInvalidaException("El dron no pertenece al jugador.");
        }

        Municion municionDisponible = null;
        for (Municion m : dron.getMuniciones()) {
            if (m != null && !m.isUsada()) {
                municionDisponible = m;
                break;
            }
        }

        if (municionDisponible == null) {
            return false;
        }

        municionDisponible.setUsada(true);
        municionDisponible.setPosicionX(dron.getPosicionX());
        municionDisponible.setPosicionY(dron.getPosicionY());
        municionDisponible.setPosicionZ(dron.getPosicionZ());
        municionDisponible.setAngulo(dron.getAngulo());
        municionDisponible.setEstado(EstadoElemento.ACTIVO);

        List<Jugador> jugadoresSesion = new java.util.ArrayList<>();
        sesion.getElementosJugadores().forEach((jugadorSesion, portaDron) -> {
            jugadoresSesion.add(jugadorSesion);
        });

        List<Evento> accionesIniciales = new java.util.ArrayList<>();
        accionesIniciales.add(new Evento_Disparo(municionDisponible));
        accionesIniciales.add(new Evento_Disparo(dron));
        boolean enviadoInicial = EnviarActualizaciones(jugadoresSesion, accionesIniciales);
        System.out.println("Disparo inicial broadcast enviado=" + enviadoInicial + " municionId=" + municionDisponible.getId());

        System.out.println("Disparo aceptado -> sesion=" + sesionId + " idDron=" + idElemento + " municionId=" + municionDisponible.getId() + " tipo=" + municionDisponible.getClass().getSimpleName());

        if (municionDisponible instanceof Bomba) {
            Bomba bomba = (Bomba) municionDisponible;
            new Thread(() -> {
                try {
                    Thread.sleep(400);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }

                bomba.setEstado(EstadoElemento.DESTRUIDO);
                List<Evento> finBomba = new java.util.ArrayList<>();
                finBomba.add(new Evento_Disparo(bomba));
                EnviarActualizaciones(jugadoresSesion, finBomba);
            }).start();

            return true;
        }

        if (municionDisponible instanceof Misil) {
            Misil misil = (Misil) municionDisponible;

            new Thread(() -> {
                float inicioX = misil.getPosicionX();
                float inicioY = misil.getPosicionY();
                float anguloRad = (float) Math.toRadians(misil.getAngulo());
                float distanciaMax = misil.getDistancia();
                if (distanciaMax <= 1f) {
                    distanciaMax = 280f;
                }
                float distanciaRecorrida = 0f;
                int velocidad = Math.max(1, misil.getVelocidad());
                if (velocidad <= 1) {
                    velocidad = 9;
                }

                while (distanciaRecorrida < distanciaMax && misil.getEstado() == EstadoElemento.ACTIVO) {
                    float paso = velocidad * 2.2f;
                    inicioX += (float) Math.cos(anguloRad) * paso;
                    inicioY += (float) Math.sin(anguloRad) * paso;
                    distanciaRecorrida += paso;

                    misil.setPosicionX(inicioX);
                    misil.setPosicionY(inicioY);

                    List<Evento> tickAcciones = new java.util.ArrayList<>();
                    tickAcciones.add(new Evento_Disparo(misil));
                    EnviarActualizaciones(jugadoresSesion, tickAcciones);

                    try {
                        Thread.sleep(30);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }

                misil.setEstado(EstadoElemento.DESTRUIDO);
                List<Evento> finMisil = new java.util.ArrayList<>();
                finMisil.add(new Evento_Disparo(misil));
                EnviarActualizaciones(jugadoresSesion, finMisil);
            }).start();
        }

        return true;
    }

    public boolean pasarALobby(Jugador jugador) throws LobbyException {

        if (jugadoresEnLobby.get(jugador.getId()) != null) {
            throw new LobbyException("El jugador ya esta en el lobby");
        }

        if (usuariosConectados.get(jugador.getId()) != null) {
            jugadoresEnLobby.put(jugador.getId(), jugador);
            return true;
        }

        return false;
    }

    @Override
    public boolean EnviarActualizaciones(List<Jugador> jugadores, List<Evento> acciones) {
        if (handler != null) {
            return handler.enviarAcciones(jugadores, acciones);
        }
        return false;
    }

    @Override
    public boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa) {
        //Sabine metió mano acá, si algo está mal, por fa corregir.
        EscenarioInicialDTO escenarioInicial = new EscenarioInicialDTO();

        for (PortaDron portaDron : portaDrones) {
            escenarioInicial.agregarJugador(new JugadorDTO(portaDron.jugador.getId(), portaDron.jugador.getNickName(), portaDron.jugador.getTeam()));

            if(portaDron.tipo == TipoElemento.AEREO)
            {
                PortaDronAereoDTO portaD = new PortaDronAereoDTO(portaDron.getId(), portaDron.getPosicionX(),portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(), portaDron.getEstado().toString(), portaDron.getJugador().getNickName(), portaDron.getJugador().getId());
                
                for (Dron dron : portaDron.getDrones()) {
                    DronAereoDTO dronDTO = new DronAereoDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(), dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(), dron.getBateria());
                    dronDTO.cargarMunicionesDesdeDron(dron);
                    portaD.agregarDron(dronDTO);
                }

                escenarioInicial.agregarPortaDronAereo(portaD);
            }else if(portaDron.tipo == TipoElemento.NAVAL)
            {
                PortaDronNavalDTO portaD = new PortaDronNavalDTO(portaDron.getId(), portaDron.getPosicionX(),portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(), portaDron.getEstado().toString(), portaDron.getJugador().getNickName(), portaDron.getJugador().getId());
                
                for (Dron dron : portaDron.getDrones()) {
                    DronNavalDTO dronDTO = new DronNavalDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(), dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(), dron.getBateria());
                    dronDTO.cargarMunicionesDesdeDron(dron);
                    portaD.agregarDron(dronDTO);
                }

                escenarioInicial.agregarPortaDronNaval(portaD);
            }
        }

        MapaDTO mp = new MapaDTO();
        mp.setContenido(mapa.getContenido());
        escenarioInicial.agregarMapa(mp);

        if (handler != null) {

            return handler.enviarInicioPartida(escenarioInicial);
        }

        return false;

    }

    public void setHandler(iHandler handler) {
        this.handler = handler;
    }

}
