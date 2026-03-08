package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public interface iPartidaService {
    boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones);
    boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa);
    void EnviarFinPartida(String ganador);
}
