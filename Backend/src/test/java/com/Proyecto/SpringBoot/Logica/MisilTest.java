package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class MisilTest {
    
    @Test
    public void testConstructor() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, j1);
        assertEquals(50, misil.getVelocidad());
        assertEquals(1500, misil.getDistancia());
    
    }

    @Test
    public void testConstructor_conParametros() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
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
        assertEquals(1500f, misil.getDistancia());
    }

    @Test
    public void setters_modificanCampos() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, j1);
        misil.setVelocidad(5);
        misil.setDistancia(10f);
        assertEquals(5, misil.getVelocidad());
        assertEquals(10f, misil.getDistancia());
        
    }

    @Test
    public void testCalculoDeNuevaPosicion_ejeY() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
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
        misil.calculoDeNuevaPosicion();
        assertEquals(10f, misil.getPosicionX());
        assertEquals(70f, misil.getPosicionY());
        assertEquals(90, misil.getAngulo());
    }

    @Test
    public void testCalculoDeNuevaPosicion_ejex() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        Misil misil = new Misil(1, 
                        10f, 
                        20f, 
                        30f, 
                        180, 
                        100, 
                        EstadoElemento.ACTIVO, 
                        50, 
                        25f, 
                        j1);
        misil.calculoDeNuevaPosicion();
        assertEquals(-40f, misil.getPosicionX());
        assertEquals(20f, misil.getPosicionY());
        assertEquals(180, misil.getAngulo());
    }

    @Test
    public void testmoverse() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
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
        
        Misil aux = (Misil) misil;
        aux.calculoDeNuevaPosicion();
        Evento_Movimiento evento = new Evento_Movimiento(aux, aux.getPosicionX(), aux.getPosicionY(), aux.angulo);
        misil.moverse(evento);
        assertEquals(10f, misil.getPosicionX());
        assertEquals(70f, misil.getPosicionY());
        assertEquals(90, misil.getAngulo());
        assertEquals(1400f, misil.getDistancia());
        assertEquals(EstadoElemento.ACTIVO, misil.getEstado());
    }

     @Test
    public void testmoverse_hastaDIS_MAX() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
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
        
        Misil aux = (Misil) misil;
        
        float dist = misil.getDIS_MAX();
        while (dist>0) {
            aux.calculoDeNuevaPosicion();
            Evento_Movimiento evento = new Evento_Movimiento(aux, aux.getPosicionX(), aux.getPosicionY(), aux.angulo);
            misil.moverse(evento);
            dist=dist-misil.getVelocidad();
        
        }
        assertEquals(10f, misil.getPosicionX());
        assertEquals(1520f, misil.getPosicionY());
        assertEquals(90, misil.getAngulo());
        assertEquals(-1500f, misil.getDistancia());
        assertEquals(EstadoElemento.INACTIVO, misil.getEstado());
    }


}
