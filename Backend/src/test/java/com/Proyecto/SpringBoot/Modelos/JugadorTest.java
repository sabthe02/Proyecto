package com.Proyecto.SpringBoot.Modelos;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class JugadorTest {
    
    @Test
    void constructor_seteaCampos() {
        Jugador jugador = new Jugador("id-1", "Nacho", "Aereo");
        assertEquals("id-1", jugador.getId());
        assertEquals("Nacho", jugador.getNickName());
        assertEquals("Aereo", jugador.getTeam());
    }
    
    @Test
    void setters_actualizanCampos() {
        Jugador jugador = new Jugador();
        jugador.setId("id-2");
        jugador.setNickName("Santi");
        jugador.setTeam("Naval");
        
        assertEquals("id-2", jugador.getId());
        assertEquals("Santi", jugador.getNickName());
        assertEquals("Naval", jugador.getTeam());
    }

}
