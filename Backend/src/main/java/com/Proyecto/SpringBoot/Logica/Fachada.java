package com.Proyecto.SpringBoot.Logica;

import java.util.Dictionary;
import java.util.List;

import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.JugadoresDAO;
import com.Proyecto.SpringBoot.Logica.Excepciones.JugadorNoExisteException;
import com.Proyecto.SpringBoot.Modelos.Jugador;


@Service
public class Fachada implements iFachada {


    Dictionary<String, Jugador> usuariosConectados; 
    Dictionary<String, Jugador> jugadoresEnLobby;
    Dictionary<String, Jugador> jugadorEnSesion;
    Dictionary<String, SesionJuego> sesionesActivas;

    iHandler handler;

    JugadoresDAO jugadoresDAO;

    public Fachada(iHandler handler) {
        this.handler = handler;
        usuariosConectados = new java.util.Hashtable<String, Jugador>();
        jugadoresEnLobby = new java.util.Hashtable<String, Jugador>();
        jugadorEnSesion = new java.util.Hashtable<String, Jugador>();
        sesionesActivas = new java.util.Hashtable<String, SesionJuego>();


        jugadoresDAO = new JugadoresDAO();
    }

    public Jugador conectarUsuario(String nickName) throws JugadorNoExisteException
    {
        Jugador jugador = jugadoresDAO.obtenerJugador(nickName);
        if (jugador != null) {
            usuariosConectados.put(jugador.getId(), jugador);
            return jugador;
        }
        
        throw new JugadorNoExisteException("El jugador " + nickName + " no existe");
    }

    boolean recuperarPartida()
    {
        throw new UnsupportedOperationException("No implementado aun");
    }

    boolean guardarPartida()
    {
        throw new UnsupportedOperationException("No implementado aun");
    }

    boolean Accion_mover(Jugador jugador, float x, float y, int angulo)
    {
        throw new UnsupportedOperationException("No implementado aun");
    }

    boolean Accion_disparar(Jugador jugador, String elemento)
    {
        throw new UnsupportedOperationException("No implementado aun");
    }

    boolean pasarALobby(Jugador jugador) throws Exception {
    
       
        if( usuariosConectados.get(jugador.getId()) != null) {
            jugadoresEnLobby.put(jugador.getId(), jugador);

            throw new Exception("Controlar si hay otro jugador en el lobby y crear la sesion de juego");
            //return true;
        }

        return false;
    }

    @Override
    public boolean EnviarActualizaciones(List<Jugador> jugadores, List<Evento> acciones) {
        handler.enviarAcciones(jugadores, acciones);
        return true;
    }

}
