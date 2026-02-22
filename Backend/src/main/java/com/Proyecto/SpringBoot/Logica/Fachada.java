package com.Proyecto.SpringBoot.Logica;

import java.util.Dictionary;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.JugadoresDAO;
import com.Proyecto.SpringBoot.Logica.Excepciones.JugadorNoExisteException;
import com.Proyecto.SpringBoot.Modelos.Jugador;


@Service
public class Fachada implements iFachada {


	@Autowired
    private JugadoresDAO jugadoresDAO;

    Dictionary<String, Jugador> usuariosConectados; 
    Dictionary<String, Jugador> jugadoresEnLobby;
    Dictionary<String, Jugador> jugadorEnSesion;
    Dictionary<String, SesionJuego> sesionesActivas;
    iHandler handler;
    


    public Fachada() {
    	
    	  usuariosConectados = new java.util.Hashtable<>();
          jugadoresEnLobby = new java.util.Hashtable<>();
          jugadorEnSesion = new java.util.Hashtable<>();
          sesionesActivas = new java.util.Hashtable<>();

        
    }

    public Jugador conectarUsuario(String nickName) throws JugadorNoExisteException {

        Jugador jugador = jugadoresDAO.findByNickName(nickName);

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
		return false;
	}


}
