package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Evento_MovimientoTest {
    
    @Test
    void constructor_seteaCampos() {
        EntidadJugador j1 = new EntidadJugador("1", "Nacho", "ACTIVO");
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
        Evento_Movimiento evento = new Evento_Movimiento(elemento, 10f, 20f, 90);
        assertEquals(1, evento.getIdElemento());
        assertEquals(10f, evento.getNuevaPosX());
        assertEquals(20f, evento.getNuevaPosY());
        assertEquals(90, evento.getNuevoAngulo());
    }

    @Test
    void setNuevaPosX_cambiaValor() {
        EntidadJugador j2 = new EntidadJugador("2", "Nacho02", "ACTIVO");
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
        Evento_Movimiento evento = new Evento_Movimiento(elemento, 10f, 20f, 90);
        evento.setNuevaPosX(15f);
        assertEquals(15f, evento.getNuevaPosX());    
    }

    @Test
    void setNuevaPosY_cambiaValor() {
        EntidadJugador j3 = new EntidadJugador("3", "Nacho03", "ACTIVO");
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
                            j3);
        Evento_Movimiento evento = new Evento_Movimiento(elemento, 10f, 20f, 90);
        evento.setNuevaPosY(25f);
        assertEquals(25f, evento.getNuevaPosY());
    }

    @Test
    void setAngulo_cambiaValor() {
        EntidadJugador j4 = new EntidadJugador("4", "Nacho04", "ACTIVO");
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
                            j4);
        Evento_Movimiento evento = new Evento_Movimiento(elemento, 10f, 20f, 90);
        evento.setNuevoAngulo(180);
        assertEquals(180, evento.getNuevoAngulo());
    }

    @Test
    void eventoMovimiento_aplicaMovimiento() {
        EntidadJugador j5 = new EntidadJugador("5", "Nacho05", "ACTIVO");
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
                            j5);
        Evento_Movimiento evento = new Evento_Movimiento(elemento, 10f, 20f, 90);
        Dron dron2 = new Dron(3, 
                            15f, 
                            25f,
                            35f, 
                            180, 
                            45, 
                            EstadoElemento.ACTIVO, 
                            1, 
                            0, 
                            50, 
                            TipoElemento.AEREO, 
                            j5);
        evento.setElemento(dron2);
        assertEquals(dron2, evento.getElemento());
    }
}
