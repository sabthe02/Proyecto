package com.Proyecto.SpringBoot.Servicios;

import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.Excepciones.LobbyException;

@Service
public class LobbyService {

    @Autowired
    JugadoresService jugadores;

    @Autowired
    PartidasService partidasService;

    // Dado un id de usuario, se obtiene el jugador en el Lobby.
    Map<String, EntidadJugador> jugadoresEnLobby;
    private Timer timerLobby;

    public LobbyService()
    {
        jugadoresEnLobby = new java.util.Hashtable<>();
        this.timerLobby = new Timer();
        this.iniciarTimer();
    }

    public boolean jugadorEnLobby(EntidadJugador jugador)
    {
        return jugadoresEnLobby.get(jugador.getId()) != null;
    }

    public void ingresarJugador(EntidadJugador jugador) throws LobbyException
    {
        if(jugadorEnLobby(jugador))
             throw new LobbyException("El jugador ya esta en el lobby");
        jugadoresEnLobby.put(jugador.getId(), jugador);
        
    }

    public void iniciarTimer() {
        TimerTask tarea = new TimerTask() {
            @Override
            public void run() {
                // Llama al método de la clase
                actualizarLobby();
            }
        };

        // Ejecutar después de 1 segundo, luego cada 3 segundos
        timerLobby.schedule(tarea, 1000, 3000);
    }

    public void actualizarLobby() {
        //System.out.println("Se actualiza lobby");

        while (partidasService.getSesionesActivas() < 10 && jugadoresEnLobby.size() > 1) {

            List<EntidadJugador> jugadoresParaSesion = new java.util.ArrayList<>();
            

            for (int i = 0; i < 2; i++) {
                String key1 = (String) jugadoresEnLobby.keySet().toArray()[0];
                jugadoresParaSesion.add(jugadoresEnLobby.remove(key1));
            }

            partidasService.crearSesion(jugadoresParaSesion);
            
        }
    }

    public void desconectarJugador(EntidadJugador jugador)
    {
        jugadoresEnLobby.remove(jugador.getId());
    }


    

}
