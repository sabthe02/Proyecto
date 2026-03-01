package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class MunicionTest {
    
    @Test
    void constructor_seteaCamposAereo() {
        Jugador j1 = new Jugador("01", "Nacho", "ACTIVO");
        Bomba bomba = new Bomba(1, j1);
        assertEquals(1, bomba.getId());
        assertEquals(100, bomba.getPeso());
        assertEquals(5f, bomba.getRadioExplosion());
        assertFalse(bomba.isUsada());
    }

    void constructor_seteaCamposNaval() {
        Jugador j1 = new Jugador("01", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, j1);
        assertEquals(1, misil.getId());
        assertEquals(1, misil.getVelocidad());
        assertEquals(1, misil.getDistancia());
        assertFalse(misil.isUsada());
    }

    @Test
    void setUsada_cambiaEstadoAereo() {
        Jugador j2 = new Jugador("002", "Nacho02", "ACTIVO");
        Bomba bomba = new Bomba(1, j2);
        bomba.setUsada(true);
        assertEquals(true, bomba.isUsada());
    }

    @Test
    void setUsada_cambiaEstadoNaval() {
        Jugador j2 = new Jugador("002", "Nacho02", "ACTIVO");
        Misil misil = new Misil(1, j2);
        misil.setUsada(true);
        assertEquals(true, misil.isUsada());
    }

    @Test
    void setPeso_cambioPeso() {
        Jugador j3 = new Jugador("003", "Nacho03", "ACTIVO");
        Bomba bomba = new Bomba(1, j3);
        bomba.setPeso(150);
        assertEquals(150, bomba.getPeso());
    }

    @Test
    void setRadioExplosion_cambioRadio() {
        Jugador j4 = new Jugador("004", "Nacho04", "ACTIVO");
        Bomba bomba = new Bomba(1, j4);
        bomba.setRadioExplosion(10f);
        assertEquals(10f, bomba.getRadioExplosion());
    }

    @Test
    void setVelocidad_cambioVelocidad() {
        Jugador j5 = new Jugador("005", "Nacho05", "ACTIVO");
        Misil misil = new Misil(1, j5);
        misil.setVelocidad(5);
        assertEquals(5, misil.getVelocidad());
    }

    @Test
    void setDistancia_cambioDistancia() {
        Jugador j6 = new Jugador("006", "Nacho06", "ACTIVO");
        Misil misil = new Misil(1, j6);
        misil.setDistancia(10f);
        assertEquals(10f, misil.getDistancia());
    }
    
}
