package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class MunicionTest {
    
    @Test
    void constructor_seteaCamposAereo() {
        EntidadJugador j1 = new EntidadJugador("01", "Nacho", "ACTIVO");
        Bomba bomba = new Bomba(1, j1, Elemento.MAX_ALTURA);
        assertEquals(1, bomba.getId());
        assertEquals(100, bomba.getPeso());
        assertEquals(5f, bomba.getRadioExplosion());
        assertFalse(bomba.isUsada());
    }

    void constructor_seteaCamposNaval() {
        EntidadJugador j1 = new EntidadJugador("01", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, j1);
        assertEquals(1, misil.getId());
        assertEquals(1, misil.getVelocidad());
        assertEquals(1, misil.getDistancia());
        assertFalse(misil.isUsada());
    }

    @Test
    void setUsada_cambiaEstadoAereo() {
        EntidadJugador j2 = new EntidadJugador("002", "Nacho02", "ACTIVO");
        Bomba bomba = new Bomba(1, j2, Elemento.MAX_ALTURA);
        bomba.setUsada(true);
        assertEquals(true, bomba.isUsada());
    }

    @Test
    void setUsada_cambiaEstadoNaval() {
        EntidadJugador j2 = new EntidadJugador("002", "Nacho02", "ACTIVO");
        Misil misil = new Misil(1, j2);
        misil.setUsada(true);
        assertEquals(true, misil.isUsada());
    }

    @Test
    void setPeso_cambioPeso() {
        EntidadJugador j3 = new EntidadJugador("003", "Nacho03", "ACTIVO");
        Bomba bomba = new Bomba(1, j3, Elemento.MAX_ALTURA);
        bomba.setPeso(150);
        assertEquals(150, bomba.getPeso());
    }

    @Test
    void setRadioExplosion_cambioRadio() {
        EntidadJugador j4 = new EntidadJugador("004", "Nacho04", "ACTIVO");
        Bomba bomba = new Bomba(1, j4, Elemento.MAX_ALTURA);
        bomba.setRadioExplosion(10f);
        assertEquals(10f, bomba.getRadioExplosion());
    }

    @Test
    void setVelocidad_cambioVelocidad() {
        EntidadJugador j5 = new EntidadJugador("005", "Nacho05", "ACTIVO");
        Misil misil = new Misil(1, j5);
        misil.setVelocidad(5);
        assertEquals(5, misil.getVelocidad());
    }

    @Test
    void setDistancia_cambioDistancia() {
        EntidadJugador j6 = new EntidadJugador("006", "Nacho06", "ACTIVO");
        Misil misil = new Misil(1, j6);
        misil.setDistancia(10f);
        assertEquals(10f, misil.getDistancia());
    }
    
}
