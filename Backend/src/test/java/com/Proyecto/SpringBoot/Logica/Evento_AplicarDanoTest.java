package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Evento_AplicarDanoTest {

    @Test
    void  constructor_seteaCampos() {
        EntidadJugador j1 = new EntidadJugador("008", "Nacho08", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            
                            TipoElemento.AEREO, 
                            j1); 
        Evento_AplicarDano evento = new Evento_AplicarDano (elemento, 100, 0, true, "Misil");
        assertEquals(0, evento.getVidaRestante());
        assertTrue(evento.isEstaDestruido());
        assertEquals("Misil", evento.getClaseProyectil());
        assertEquals(100, evento.getDano());
        
    }

    @Test
    void constructor_porDefecto () {
        Evento_AplicarDano evento = new Evento_AplicarDano ();
        assertEquals(0, evento.getVidaRestante());
        assertFalse(evento.isEstaDestruido());
        assertEquals("", evento.getClaseProyectil());
        assertEquals(0, evento.getDano());
    }

    @Test
    void set_seteaNuevosValores () {
        Evento_AplicarDano evento = new Evento_AplicarDano ();
        evento.setClaseProyectil("Misil");
        evento.setDano(10);
        evento.setEstaDestruido(true);
        evento.setVidaRestante(90);
        assertEquals(90, evento.getVidaRestante());
        assertTrue(evento.isEstaDestruido());
        assertEquals("Misil", evento.getClaseProyectil());
        assertEquals(10, evento.getDano());
    }
    
}
