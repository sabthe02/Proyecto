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

            SesionJuego nuevaSesion = new SesionJuego(idSesion, jugadoresParaSesion, this);
            sesionesActivas.put(nuevaSesion.getIdSesion(), nuevaSesion);

            nuevaSesion.iniciarSesion();
        }
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

        if(sesionId == null) {
            throw new AccionInvalidaException("El jugador no esta en una sesion activa.");
        }

        Elemento elemento = sesionesActivas.get(sesionId).getElementosEnJuego().get(idElemento);
        Evento_Movimiento evento = new Evento_Movimiento(elemento, y, z, angulo);
        return sesionesActivas.get(sesionId).getAccionesPendientesProcesar().add(evento);
    }

    public boolean accion_disparar(Jugador jugador, int idElemento) throws AccionInvalidaException {
        String sesionId = jugadorEnSesion.get(jugador.getId());

        if(sesionId == null) {
            throw new AccionInvalidaException("El jugador no esta en una sesion activa.");
        }

        Elemento elemento = sesionesActivas.get(sesionId).getElementosEnJuego().get(idElemento);
        Evento_Disparo evento = new Evento_Disparo(elemento);
        return sesionesActivas.get(sesionId).getAccionesPendientesProcesar().add(evento);
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
        return false;
    }

    @Override
    public boolean EnviarInicioPartida(List<PortaDron> portaDrones) {

        EscenarioInicialDTO escenarioInicial = new EscenarioInicialDTO();

        for (PortaDron portaDron : portaDrones) {
            escenarioInicial.agregarJugador(new JugadorDTO(portaDron.jugador.getId(), portaDron.jugador.getNickName()));

            if(portaDron.tipo == TipoElemento.AEREO)
            {
                PortaDronAereoDTO portaD = new PortaDronAereoDTO(portaDron.getId(), portaDron.getPosicionX(),portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(), portaDron.getEstado().toString(), portaDron.getJugador().getNickName());
                
                for (Dron dron : portaDron.getDrones()) {
                    portaD.agregarDron(new DronAereoDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(), dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(), dron.getBateria()));
                }

                escenarioInicial.agregarPortaDronAereo(portaD);
            }else if(portaDron.tipo == TipoElemento.NAVAL)
            {
                PortaDronNavalDTO portaD = new PortaDronNavalDTO(portaDron.getId(), portaDron.getPosicionX(),portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(), portaDron.getEstado().toString(), portaDron.getJugador().getNickName());
                
                for (Dron dron : portaDron.getDrones()) {
                    portaD.agregarDron(new DronNavalDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(), dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(), dron.getBateria()));
                }

                escenarioInicial.agregarPortaDronNaval(portaD);
            }
        }

        if (handler != null) {

            return handler.enviarInicioPartida(escenarioInicial);
        }

        return false;

    }

    public void setHandler(iHandler handler) {
        this.handler = handler;
    }

}
