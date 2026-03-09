package com.Proyecto.SpringBoot.Logica;


import java.util.List;
import java.util.Map;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
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
import com.Proyecto.SpringBoot.Servicios.JugadoresService;
import com.Proyecto.SpringBoot.Servicios.LobbyService;
import com.Proyecto.SpringBoot.Servicios.PartidasService;

import jakarta.annotation.PostConstruct;

@Service
public class Fachada implements iFachada {


    @Autowired
    LobbyService lobbyService;

    @Autowired 
    PartidasService partidasService;

    @Autowired
    JugadoresService jugadoresService;


    iHandler handler;

    public Fachada() {
    }


    @PostConstruct
    public void init() {
        // Este método se ejecuta cuando partidasService YA NO es null
        this.partidasService.setiFachada(this);
    }

    public EntidadJugador loginUsuario(String nickName) throws JugadorNoExisteException {
        return jugadoresService.loginUsuario(nickName);
    }

    public EntidadJugador crearUsuario(String nickName, String team) throws ExisteNickNameException {
        
        return jugadoresService.crearUsuario(nickName, team);
    }

    public void desconectarUsuario(EntidadJugador jugador) throws Exception
    {
        jugadoresService.desconectarUsuario(jugador);
        lobbyService.desconectarJugador(jugador);
        partidasService.desconectarJugador(jugador);
    }

    public boolean recuperarPartida(EntidadJugador jugador) {
        return partidasService.recuperarPartida(jugador);
    }

    public boolean guardarPartida(EntidadJugador jugador) {
        return partidasService.recuperarPartida(jugador);
    }

    public boolean accion_mover(EntidadJugador jugador, int idElemento, float x, float y, float z, int angulo)
            throws AccionInvalidaException {
        return partidasService.accion_mover(jugador, idElemento, x, y, z, angulo);
    }

    // Accion para desplegar un dron desde el portadron
    public boolean accion_desplegar(EntidadJugador jugador, int idPortaDron) throws AccionInvalidaException {
        return partidasService.accion_desplegar(jugador, idPortaDron);
    }

    public boolean accion_disparar(EntidadJugador jugador, int idElemento) throws AccionInvalidaException {
        return partidasService.accion_disparar(jugador, idElemento);
    }

    public void pasarALobby(EntidadJugador jugador) throws LobbyException {
        jugadoresService.pasarALobby(jugador);
    }

    @Override
    public boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones) {
        if (handler != null) {
            return handler.enviarAcciones(jugadores, acciones);
        }
        return false;
    }

    @Override
    public boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa) {

        EscenarioInicialDTO escenarioInicial = new EscenarioInicialDTO();

        for (PortaDron portaDron : portaDrones) {
            escenarioInicial.agregarJugador(new JugadorDTO(portaDron.jugador.getId(), portaDron.jugador.getNickName(),
                    portaDron.jugador.getTeam()));

            if (portaDron.tipo == TipoElemento.AEREO) {
                PortaDronAereoDTO portaD = new PortaDronAereoDTO(portaDron.getId(), portaDron.getPosicionX(),
                        portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(),
                        portaDron.getEstado().toString(), portaDron.getJugador().getNickName(),
                        portaDron.getJugador().getId());

                for (Dron dron : portaDron.getDrones()) {
                    DronAereoDTO dronDTO = new DronAereoDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(),
                            dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(),
                            dron.getBateria());
                    dronDTO.cargarMunicionesDesdeDron(dron);
                    portaD.agregarDron(dronDTO);
                }

                escenarioInicial.agregarPortaDronAereo(portaD);
            } else if (portaDron.tipo == TipoElemento.NAVAL) {
                PortaDronNavalDTO portaD = new PortaDronNavalDTO(portaDron.getId(), portaDron.getPosicionX(),
                        portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(),
                        portaDron.getEstado().toString(), portaDron.getJugador().getNickName(),
                        portaDron.getJugador().getId());

                for (Dron dron : portaDron.getDrones()) {
                    DronNavalDTO dronDTO = new DronNavalDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(),
                            dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(),
                            dron.getBateria());
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

    @Override
    public void EnviarFinPartida(String ganador) {
        // Obtener jugadores de la sesión activa
        String idSesion = jugadorEnSesion.values().iterator().hasNext() ? 
                         jugadorEnSesion.values().iterator().next() : null;
        
        if (idSesion != null && sesionesActivas.containsKey(idSesion)) {
            SesionJuego sesion = sesionesActivas.get(idSesion);
            List<Jugador> jugadores = new java.util.ArrayList<>(sesion.getElementosJugadores().keySet());
            
            if (handler != null) {
                handler.enviarFinPartida(jugadores, ganador);
            }
        }
    }

    private boolean detectarColision(Municion proyectil, Elemento objetivo, float radioColision) {
        // hecho esto porque no vi nada hecho, por fa borrar si no aplica
        if (objetivo == null) {
            return false;
        }
        if (proyectil == null) {
            return false;
        }
        if (objetivo.getEstado() != EstadoElemento.ACTIVO) {
            return false;
        }

        // Para bombas, solo detectar colision cuando estan cerca del suelo
        // Esto evita que la bomba impacte unidades mientras esta cayendo en el aire
        if (proyectil instanceof Bomba) {
            if (proyectil.getPosicionZ()> 50) {
                // La bomba todavia esta en el aire, no hay colision
                return false;
            }
            // Para drones aereos volando alto, verificar altura
            // Pero PORTADRONES siempre pueden ser impactados (son objetivos grandes/estáticos)
            if (objetivo instanceof Dron && objetivo.getPosicionZ() > 50) {
                // El dron esta volando alto, la bomba no puede impactarlo
                return false;
            }
        }

        float dx = proyectil.getPosicionX() - objetivo.getPosicionX();
        float dy = proyectil.getPosicionY() - objetivo.getPosicionY();
        float distancia = (float) Math.sqrt(dx * dx + dy * dy);

        return distancia <= radioColision;
    }

    private void aplicarDano(Elemento objetivo, Municion proyectil, List<EntidadJugador> jugadoresSesion) {
        if (objetivo == null) {
            return;
        }
        if (proyectil == null) {
            return;
        }

        int danoInfligido = 0;
        String claseProyectil = "";

        if (proyectil instanceof Misil) {
            danoInfligido = 50;
            claseProyectil = "MISIL";
        }
        if (proyectil instanceof Bomba) {
            danoInfligido = 100;
            claseProyectil = "BOMBA";
        }

        int vidaActual = objetivo.getVida();
        int vidaNueva = vidaActual - danoInfligido;
        if (vidaNueva < 0) {
            vidaNueva = 0;
        }

        objetivo.setVida(vidaNueva);

        boolean estaDestruido = false;
        if (vidaNueva <= 0) {
            estaDestruido = true;
            objetivo.setEstado(EstadoElemento.DESTRUIDO);
        }

        proyectil.setEstado(EstadoElemento.DESTRUIDO);

        Evento_AplicarDanoTest eventoDano = new Evento_AplicarDanoTest(objetivo, danoInfligido, vidaNueva, estaDestruido,
                claseProyectil);
        List<Evento> eventos = new java.util.ArrayList<>();
        eventos.add(eventoDano);
        
        // Si el objetivo fue destruido, también enviar Evento_Movimiento con estado DESTRUIDO
        // Esto permite que Frontend lo elimine del mapa
        if (estaDestruido) {
            Evento_Movimiento eventoDestruccion = new Evento_Movimiento(
                objetivo,
                objetivo.getPosicionX(),
                objetivo.getPosicionY(),
                objetivo.getAngulo()
            );
            eventoDestruccion.habilitar();
            eventos.add(eventoDestruccion);
            System.out.println("Enviando Evento_Movimiento DESTRUIDO para elemento " + objetivo.getId());
        }
        
        EnviarActualizaciones(jugadoresSesion, eventos);

        System.out.println("Daño aplicado: objetivo=" + objetivo.getId() + " vida=" + vidaNueva + "/" + vidaActual
                + " destruido=" + estaDestruido);
    }

    private Elemento buscarObjetivoImpactado(Municion proyectil, SesionJuego sesion, float radioColision) {
        if (proyectil == null) {
            return null;
        }
        if (sesion == null) {
            return null;
        }

        EntidadJugador disparador = proyectil.getJugador();
        if (disparador == null) {
            return null;
        }

        Map<Integer, Elemento> elementos = sesion.getElementosEnJuego();
        Elemento objetivoEncontrado = null;

        for (Elemento elemento : elementos.values()) {
            if (elemento == null) {
                continue;
            }
            if (elemento.getId() == proyectil.getId()) {
                continue;
            }
            if (elemento instanceof Municion) {
                continue;
            }

            EntidadJugador propietario = elemento.getJugador();
            if (propietario == null) {
                continue;
            }
            if (propietario.getId().equals(disparador.getId())) {
                continue;
            }

            boolean hayColision = detectarColision(proyectil, elemento, radioColision);
            if (hayColision) {
                objetivoEncontrado = elemento;
                return objetivoEncontrado;
            }
        }

        return objetivoEncontrado;
    }

}