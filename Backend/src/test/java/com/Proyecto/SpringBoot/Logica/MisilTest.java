package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class MisilTest {
    
    @Test
    public void testConstructor() {
        Jugador j1 = new Jugador("001", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, j1);
        assertEquals(1, misil.getVelocidad());
        assertEquals(1, misil.getDistancia());
    
    }

    @Test
    public void testConstructor_conParametros() {
        Jugador j1 = new Jugador("001", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, 
                        10f, 
                        20f, 
                        30f, 
                        90, 
                        100, 
                        EstadoElemento.ACTIVO, 
                        50, 
                        25f, 
                        j1);
        assertEquals(50, misil.getVelocidad());
        assertEquals(25f, misil.getDistancia());
    }

    @Test
    public void setters_modificanCampos() {
        Jugador j1 = new Jugador("001", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, j1);
        misil.setVelocidad(5);
        misil.setDistancia(10f);
        assertEquals(5, misil.getVelocidad());
        assertEquals(10f, misil.getDistancia());
        
    }

}
