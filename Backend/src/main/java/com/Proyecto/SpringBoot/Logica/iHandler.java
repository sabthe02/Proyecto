package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;
import com.Proyecto.SpringBoot.Logica.DTO.JugadorDTO;

public interface iHandler {

    boolean enviarAcciones(List<EntidadJugador> jugadores, List<Evento> acciones);
    boolean enviarInicioPartida(EscenarioInicialDTO partida);
    boolean enviarFinPartida(List<JugadorDTO> jugadores, String ganadorId);
}
