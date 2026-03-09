package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class BombaTest {    

    @Test
    void constructor_seteaCampos() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        Bomba bomba = new Bomba(1, 
                            5f, 
                            20f,
                            30f, 
                            180, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            100, 
                            100, 
                            j1);
        assertEquals(100, bomba.getPeso());
        assertEquals(100, bomba.getRadioExplosion());
    }
    
    @Test
    void setters_modificanCampos() {    
        EntidadJugador j2 = new EntidadJugador("002", "Nacho02", "ACTIVO");
        Bomba bomba = new Bomba(1, 
                            5f, 
                            20f,
                            30f, 
                            180, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            100, 
                            100, 
                            j2);
        bomba.setPeso(150);
        bomba.setRadioExplosion(150);
        assertEquals(150, bomba.getPeso());
        assertEquals(150, bomba.getRadioExplosion());
    }

    @Test
    void moverse_modificaPosicionZ() {
        EntidadJugador j3 = new EntidadJugador("003", "Nacho03", "ACTIVO");
        Bomba bomba = new Bomba(1, 
                            5f, 
                            20f,
                            30f, 
                            180, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            100, 
                            100, 
                            j3);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(bomba, 5f, 20f, 180);
        bomba.moverse(eventoMovimiento);
        assertEquals(29.5f, bomba.getPosicionZ());
    }

    @Test
    void velocidadInicio_seReinicia() {
        EntidadJugador j4 = new EntidadJugador("004", "Nacho04", "ACTIVO");
        Bomba bomba = new Bomba(1, 
                            5f, 
                            20f,
                            30f, 
                            180, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            100, 
                            100, 
                            j4);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(bomba, 5f, 20f, 180);
        bomba.moverse(eventoMovimiento);              
        bomba.reiniciarVelocidadInicio();
        assertEquals(0, bomba.getVelocidadInicio());
    }   

    @Test
    void bomba_seMueveHastaElSuelo() {
        EntidadJugador j5 = new EntidadJugador("005", "Nacho05", "ACTIVO");
        Bomba bomba = new Bomba(1, 
                            5f, 
                            20f,
                            1f, 
                            180, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            100, 
                            100, 
                            j5);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(bomba, 5f, 20f, 180);
        bomba.moverse(eventoMovimiento);              
        assertEquals(0.5f, bomba.getPosicionZ());
    }

    @Test
    void velocidadInicio_aumenta() {
        EntidadJugador j4 = new EntidadJugador("004", "Nacho04", "ACTIVO");
        Bomba bomba = new Bomba(1, 
                            5f, 
                            20f,
                            30f, 
                            180, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            100, 
                            100, 
                            j4);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(bomba, 5f, 20f, 180);
        bomba.moverse(eventoMovimiento);     
        float velocidadAumenta =   bomba.getPosicionZ()-(bomba.getPosicionZ()-bomba.getVelocidadInicio()); 
        assertEquals(0.5f, velocidadAumenta);
    }
        
}
