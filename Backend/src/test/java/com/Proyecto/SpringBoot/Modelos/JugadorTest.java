package com.Proyecto.SpringBoot.Modelos;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

import static org.junit.jupiter.api.Assertions.*;

public class JugadorTest {
    
    @Test
    void constructor_seteaCampos() {
        EntidadJugador jugador = new EntidadJugador("id-1", "Nacho", "Aereo");
        assertEquals("id-1", jugador.getId());
        assertEquals("Nacho", jugador.getNickName());
        assertEquals("Aereo", jugador.getTeam());
    }
    
    @Test
    void setters_actualizanCampos() {
        EntidadJugador jugador = new EntidadJugador();
        jugador.setId("id-2");
        jugador.setNickName("Santi");
        jugador.setTeam("Naval");
        
        assertEquals("id-2", jugador.getId());
        assertEquals("Santi", jugador.getNickName());
        assertEquals("Naval", jugador.getTeam());
    }

    @Test
    void constructor_conParametros_seteaCampos() {
        EntidadJugador jugador = new EntidadJugador("id-3", "Lucho", "Terrestre");
        assertEquals("id-3", jugador.getId());
        assertEquals("Lucho", jugador.getNickName());
        assertEquals("Terrestre", jugador.getTeam());
    }

    @Test
    void constructor_porDefecto_seteaCamposVacios() {
        EntidadJugador jugador = new EntidadJugador();
        assertEquals("", jugador.getId());
        assertEquals("", jugador.getNickName());
        assertEquals("", jugador.getTeam());
    }

}
