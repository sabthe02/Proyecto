package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;
import com.Proyecto.SpringBoot.Modelos.Jugador;

public interface iHandler {

    boolean enviarAcciones(List<Jugador> jugadores, List<Evento> acciones);
    boolean enviarInicioPartida(EscenarioInicialDTO partida);
}
