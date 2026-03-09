package com.Proyecto.SpringBoot.Servicios;

import java.util.Dictionary;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.DAO.JugadoresDAO;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.Excepciones.ExisteNickNameException;
import com.Proyecto.SpringBoot.Logica.Excepciones.JugadorNoExisteException;
import com.Proyecto.SpringBoot.Logica.Excepciones.LobbyException;
import com.Proyecto.SpringBoot.Logica.Excepciones.UsuariosException;

@Service
public class JugadoresService {
    public java.util.List<EntidadJugador> getJugadores() {
        return java.util.Collections.list(usuariosConectados.elements());
    }

    // Dado un id de usuario obtenermos el jugador.
    private Dictionary<String, EntidadJugador> usuariosConectados;

    @Autowired
    private JugadoresDAO jugadoresDAO;

    @Autowired
    @Lazy
    private LobbyService lobbyService;

    public JugadoresService()
    {
        usuariosConectados = new java.util.Hashtable<>();
    }


    public EntidadJugador loginUsuario(String nickName) throws JugadorNoExisteException {

        EntidadJugador jugador = null;

        try {
            jugador = jugadoresDAO.findByNickName(nickName);
        } catch (Exception e) {
            System.err.println("Error al buscar jugador: " + e.getMessage());
        }

        if (jugador != null) {
            if (usuariosConectados.get(jugador.getId()) == null) {
                usuariosConectados.put(jugador.getId(), jugador);
            }

            return jugador;
        }

        throw new JugadorNoExisteException("El jugador " + nickName + " no existe");
    }

    public EntidadJugador crearUsuario(String nickName, String team) throws ExisteNickNameException {
        if (jugadoresDAO.findByNickName(nickName) != null) {
            throw new ExisteNickNameException("El NickName " + nickName + " ya existe.");
        }

        EntidadJugador nuevoJugador = new EntidadJugador();

        nuevoJugador.setNickName(nickName);
        nuevoJugador.setTeam(team);
        return jugadoresDAO.save(nuevoJugador);
    }

    public boolean desconectarUsuario(EntidadJugador jugador)
    {
        usuariosConectados.remove(jugador.getId());
        return true;
    }

    public void pasarALobby(EntidadJugador jugador) throws LobbyException, UsuariosException {

        if (usuariosConectados.get(jugador.getId()) != null) {
            lobbyService.ingresarJugador(jugador);
            
        }else{
            throw new UsuariosException("El usuario no esta logueado en el sistema.");
        }

    }

}
