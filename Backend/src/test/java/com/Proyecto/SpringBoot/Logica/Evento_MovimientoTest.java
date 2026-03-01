package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Evento_MovimientoTest {
    
    @Test
    void constructor_seteaCampos() {
        Jugador j1 = new Jugador("1", "Nacho", "ACTIVO");
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
        assertEquals(90, evento.getAngulo());
        assertEquals(90, evento.getAngulo());
    }

    @Test
    void setNuevaPosX_cambiaValor() {
        Jugador j2 = new Jugador("2", "Nacho02", "ACTIVO");
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
        Jugador j3 = new Jugador("3", "Nacho03", "ACTIVO");
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
        Jugador j4 = new Jugador("4", "Nacho04", "ACTIVO");
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
        evento.setAngulo(180);
        assertEquals(180, evento.getAngulo());
    }

    @Test
    void eventoMovimiento_aplicaMovimiento() {
        Jugador j5 = new Jugador("5", "Nacho05", "ACTIVO");
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
