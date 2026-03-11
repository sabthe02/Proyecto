package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.Excepciones.PartidaException;

public interface iFachada {
    boolean guardarPartida (String idJugador)throws PartidaException ;
    boolean recuperarPartida (String idJugador) throws PartidaException ;
    boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones);
    boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa);
    void EnviarFinPartida(List<EntidadJugador> jugadores, EntidadJugador ganador, String mensaje);
}
