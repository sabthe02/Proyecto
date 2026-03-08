package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.DTO.CambiosDTO;
import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;

public interface iHandler {

    boolean enviarAcciones(List<EntidadJugador> jugadores, CambiosDTO cambios);
    boolean enviarInicioPartida(EscenarioInicialDTO partida);
    boolean enviarFinPartida(List<String> jugadores,  String ganadorId);
}
