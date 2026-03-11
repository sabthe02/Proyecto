package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Evento_RecibeImpactoTest {
    
    @Test   
    public void testConstructor_porDefecto() {
        Evento_RecibeImpacto evento = new Evento_RecibeImpacto();
        assertEquals(0, evento.getIdElementoEmisor());
    }

    @Test
    public void testConstructor_conParametros() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            
                            TipoElemento.AEREO, 
                            j1);
        Evento_RecibeImpacto evento = new Evento_RecibeImpacto(elemento, elemento);
        assertEquals(2, evento.getIdElementoEmisor());
    }

    @Test
    public void testSetIdElementoEmisor() {
        EntidadJugador j2 = new EntidadJugador("002", "Nacho02", "ACTIVO");
        Dron elemento = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                           
                            TipoElemento.AEREO, 
                            j2);
        Evento_RecibeImpacto evento = new Evento_RecibeImpacto(elemento, elemento);
       // evento.setIdElementoEmisor(3);
        assertEquals(3, evento.getIdElementoEmisor());
    }
}
