package com.Proyecto.SpringBoot.Logica;

import java.util.Dictionary;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.JugadoresDAO;
import com.Proyecto.SpringBoot.Logica.Excepciones.ExisteNickNameException;
import com.Proyecto.SpringBoot.Logica.Excepciones.JugadorNoExisteException;
import com.Proyecto.SpringBoot.Logica.Excepciones.LobbyException;
import com.Proyecto.SpringBoot.Modelos.Jugador;

@Service
public class Fachada implements iFachada {

    private Timer timerLobby;

    @Autowired
    private JugadoresDAO jugadoresDAO;

    Dictionary<String, Jugador> usuariosConectados;
    Map<String, Jugador> jugadoresEnLobby;
    Dictionary<String, Jugador> jugadorEnSesion;
    Dictionary<String, SesionJuego> sesionesActivas;

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

        while (jugadoresEnLobby.size() > 1) {

            String key1 = (String) jugadoresEnLobby.keySet().toArray()[0];
            String key2 = (String) jugadoresEnLobby.keySet().toArray()[1];

            List<Jugador> jugadoresParaSesion = new java.util.ArrayList<>();

            jugadoresParaSesion.add(jugadoresEnLobby.remove(key1));
            jugadoresParaSesion.add(jugadoresEnLobby.remove(key2));

            SesionJuego nuevaSesion = new SesionJuego("Sesion-" + System.currentTimeMillis(), jugadoresParaSesion,
                    this);

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

    public boolean accion_mover(Jugador jugador, float x, float y, int angulo) {
        throw new UnsupportedOperationException("No implementado aun");
    }

    public boolean accion_disparar(Jugador jugador, String elemento) {
        throw new UnsupportedOperationException("No implementado aun");
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
        if (handler != null) {

            return handler.enviarInicioPartida(portaDrones);
        }

        return false;

    }

    public void setHandler(iHandler handler) {
        this.handler = handler;
    }

}
