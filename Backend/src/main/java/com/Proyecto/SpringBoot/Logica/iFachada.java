package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public interface iFachada {
    boolean EnviarActualizaciones(List<Jugador> jugadores, List<Evento> acciones);
}
