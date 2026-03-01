package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Evento_RecibeImpactoTest {
    
    @Test   
    public void testConstructor_porDefecto() {
        Evento_RecibeImpacto evento = new Evento_RecibeImpacto();
        assertEquals(0, evento.getIdElementoEmisor());
    }

    @Test
    public void testConstructor_conParametros() {
        Jugador j1 = new Jugador("001", "Nacho", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            1, 
                            0, 
                            50, 
                            TipoElemento.AEREO, 
                            j1);
        Evento_RecibeImpacto evento = new Evento_RecibeImpacto(elemento, 2);
        assertEquals(2, evento.getIdElementoEmisor());
    }

    @Test
    public void testSetIdElementoEmisor() {
        Jugador j2 = new Jugador("002", "Nacho02", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            1, 
                            0, 
                            50, 
                            TipoElemento.AEREO, 
                            j2);
        Evento_RecibeImpacto evento = new Evento_RecibeImpacto(elemento, 2);
        evento.setIdElementoEmisor(3);
        assertEquals(3, evento.getIdElementoEmisor());
    }
}
