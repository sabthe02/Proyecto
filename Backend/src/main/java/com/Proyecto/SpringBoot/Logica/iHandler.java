package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;

public interface iHandler {

    boolean enviarAcciones(List<EntidadJugador> jugadores, List<Evento> acciones);
    boolean enviarInicioPartida(EscenarioInicialDTO partida);
}
