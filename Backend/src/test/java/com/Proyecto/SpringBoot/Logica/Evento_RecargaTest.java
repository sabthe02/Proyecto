package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Evento_RecargaTest {
    
    @Test
    void constructor_porDefecto() {
        Evento_Recarga evento = new Evento_Recarga();
        assertFalse(evento.isCargaIniciada());
        assertNull(evento.getDronAsociado());
    }

    @Test
    void constructor_completo() {
        EntidadJugador j1 = new EntidadJugador("008", "Nacho08", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.AEREO, 
                            j1); 
        Evento_Recarga evento = new Evento_Recarga(elemento);
        assertFalse(evento.isCargaIniciada());
        assertNull(evento.getDronAsociado());
    }

    @Test
    void eventoRecarga_comienzaCarga() {
        EntidadJugador j1 = new EntidadJugador("008", "Nacho08", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.AEREO, 
                            j1); 
        Evento_Recarga evento = new Evento_Recarga(elemento);
        evento.comenzarCarga(elemento);
        assertTrue(evento.isCargaIniciada());
        assertEquals(elemento, evento.getDronAsociado());
    }

    @Test
    void eventoRecarga_fianlizaCarga() {
        EntidadJugador j1 = new EntidadJugador("008", "Nacho08", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.AEREO, 
                            j1); 
        Evento_Recarga evento = new Evento_Recarga(elemento);
        evento.comenzarCarga(elemento);
        assertTrue(evento.isCargaIniciada());
        assertEquals(elemento, evento.getDronAsociado());
        evento.finalizarCarga();
        assertFalse(evento.isCargaIniciada());
        assertEquals(elemento, evento.getDronAsociado());
    }

}
