package com.Proyecto.SpringBoot.Logica;


import java.util.List;
import java.util.Map;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.DTO.CambiosDTO;
import com.Proyecto.SpringBoot.Logica.DTO.DronAereoDTO;
import com.Proyecto.SpringBoot.Logica.DTO.DronNavalDTO;
import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;
import com.Proyecto.SpringBoot.Logica.DTO.JugadorDTO;
import com.Proyecto.SpringBoot.Logica.DTO.LoginUsuarioDTO;
import com.Proyecto.SpringBoot.Logica.DTO.MapaDTO;
import com.Proyecto.SpringBoot.Logica.DTO.MapearDTO;
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
    public void EnviarFinPartida(String ganador) {
        // Implementar enviar fin partida cuando iHandler lo soporte
    }


}