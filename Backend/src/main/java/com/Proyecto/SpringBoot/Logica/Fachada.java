package com.Proyecto.SpringBoot.Logica;


import java.util.ArrayList;
import java.util.List;
import java.util.Map;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.DTO.CambiosDTO;

import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;
import com.Proyecto.SpringBoot.Logica.DTO.LoginUsuarioDTO;
import com.Proyecto.SpringBoot.Logica.DTO.MapaDTO;
import com.Proyecto.SpringBoot.Logica.DTO.MapearDTO;

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

    public LoginUsuarioDTO loginUsuario(String nickName) throws JugadorNoExisteException {
        EntidadJugador jugador = jugadoresService.loginUsuario(nickName);
       
        boolean partidaGuardada = partidasService.existePartidaByJugador(jugador);

        LoginUsuarioDTO usuarioDTO = new LoginUsuarioDTO(jugador.getId(), jugador.getNickName(), jugador.getTeam(), partidaGuardada);
        return usuarioDTO;
    }
    public LoginUsuarioDTO crearUsuario(String nickName, String team) throws ExisteNickNameException {
        
        EntidadJugador jugador = jugadoresService.crearUsuario(nickName, team);
        LoginUsuarioDTO usuarioDTO = new LoginUsuarioDTO(jugador.getId(), jugador.getNickName(), jugador.getTeam(), false);


        return usuarioDTO;
    }

    public void desconectarUsuario(String idJugador) throws Exception
    {
        EntidadJugador jugador = jugadoresService.obtenerJugadorConectado(idJugador);
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

    public boolean accion_mover(String idJugador, int idElemento, float x, float y, float z, int angulo)
            throws AccionInvalidaException {
        return partidasService.accion_mover(jugadoresService.obtenerJugadorConectado(idJugador), idElemento, x, y, z, angulo);
    }

    // Accion para desplegar un dron desde el portadron
    public boolean accion_desplegar(String  idJugador, int idPortaDron) throws AccionInvalidaException {
        return partidasService.accion_desplegar(jugadoresService.obtenerJugadorConectado(idJugador), idPortaDron);
    }

    public boolean accion_disparar(String idJugador, int idElemento) throws AccionInvalidaException {
        return partidasService.accion_disparar(jugadoresService.obtenerJugadorConectado(idJugador), idElemento);
    }

    public void pasarALobby(String idjugador) throws LobbyException {
        jugadoresService.pasarALobby(jugadoresService.obtenerJugadorConectado(idjugador));
    }

    @Override
    public boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones) {
        if (handler != null) {
            MapearDTO mapeo = new MapearDTO();
            CambiosDTO cambios = mapeo.mapearCambios(acciones);
            return handler.enviarAcciones(jugadores, cambios);
        }
        return false;
    }

    @Override
    public boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa) {

        EscenarioInicialDTO escenarioInicial = new MapearDTO().mapearEscenario(portaDrones);

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
    public void EnviarFinPartida(List<EntidadJugador> jugadores, EntidadJugador ganador) {
         
        if (handler != null) {
            List<String> listaJugadores = new ArrayList<>();
            for (EntidadJugador entidadJugador : jugadores) {
                listaJugadores.add(entidadJugador.getId());
            }
            if(ganador != null)
                handler.enviarFinPartida(listaJugadores, ganador.getId());
            else{
                handler.enviarFinPartida(listaJugadores, "EMPATE");
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
        
    }
}