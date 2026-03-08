package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public interface iFachada {
    boolean guardarPartida (EntidadJugador jugador);
    boolean recuperarPartida (EntidadJugador jugador);
    boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones);
    boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa);
    void EnviarFinPartida(List<EntidadJugador> jugadores, EntidadJugador ganador);
}
