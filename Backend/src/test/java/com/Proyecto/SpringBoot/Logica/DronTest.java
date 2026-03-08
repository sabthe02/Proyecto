package com.Proyecto.SpringBoot.Logica;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class DronTest {
    
    @Test
    void constructor_seteaCamposAereo() {
        Jugador j1 = new Jugador("id-1", "Nacho", "ACTIVO");
        Dron dron = new Dron(1, 
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
        assertEquals(EstadoElemento.ACTIVO, dron.getEstado());
        assertEquals(TipoElemento.AEREO, dron.getTipo());
        assertEquals(1000, dron.getBateria());
        assertEquals(10, dron.getPosicionX());
        assertEquals(20, dron.getPosicionY());
        assertEquals(30, dron.getPosicionZ());
        assertEquals(90, dron.getAngulo());
        assertEquals(100, dron.getVida());
        List<Municion> municiones = dron.getMuniciones();
        assertEquals(0, municiones.size());
        assertEquals(1, dron.getCantidadMunicionInicial());
    }

    @Test
    void constructor_seteaCamposNaval() {
        Jugador j1 = new Jugador("id-1", "Nacho", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            1, 
                            0, 
                            50, 
                            TipoElemento.NAVAL, 
                            j1);
        assertEquals(EstadoElemento.ACTIVO, dron.getEstado());
        assertEquals(TipoElemento.NAVAL, dron.getTipo());
        assertEquals(1000, dron.getBateria());
        assertEquals(10, dron.getPosicionX());
        assertEquals(20, dron.getPosicionY());
        assertEquals(30, dron.getPosicionZ());
        assertEquals(90, dron.getAngulo());
        assertEquals(100, dron.getVida());
        List<Municion> municiones = dron.getMuniciones();
        assertEquals(0, municiones.size());
        assertEquals(2, dron.getCantidadMunicionInicial());
    }

    @Test
    void agregarMunicion_agregaBomba() {
        Jugador j2 = new Jugador("002", "Nacho02", "ACTIVO");
        Dron dron = new Dron(1, 
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
                            j2);
        dron.agregarMunicion(1);
        assertEquals(1, dron.cantidadMunicionesDisponibles());
        assertEquals(0, dron.cantidadMunicionesUsadas());
            
    }

    @Test
    void agregarMunicion_agregaMisil() {
        Jugador j3 = new Jugador("003", "Nacho03", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.NAVAL, 
                            j3);  
        dron.agregarMunicion(1);
        assertEquals(1, dron.cantidadMunicionesDisponibles());  
        assertEquals(0, dron.cantidadMunicionesUsadas());
    }
    
    @Test
    void cantidadMunicionesUsadas_cuentaCorrectamente() {
        Jugador j4 = new Jugador("004", "Nacho04", "ACTIVO");
        Dron dron = new Dron(1, 
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
                            j4);  
        Municion municion1 = dron.agregarMunicion(1);
        dron.agregarMunicion(2);
        dron.agregarMunicion(3);
        municion1.setUsada(true);
        assertEquals(1, dron.cantidadMunicionesUsadas());
        assertEquals(2, dron.cantidadMunicionesDisponibles());
    }

    @Test
    void cantidadMunicionesDisponibles_cuentaCorrectamente() {
        Jugador j5 = new Jugador("005", "Nacho05", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.NAVAL, 
                            j5);  
        dron.agregarMunicion(1);
        dron.agregarMunicion(2);
        dron.agregarMunicion(3);
        List<Municion> municiones = dron.getMuniciones();
        municiones.get(0).setUsada(true);
        assertEquals(2, dron.cantidadMunicionesDisponibles());
        assertEquals(1, dron.cantidadMunicionesUsadas());
    }

    @Test
    void cargarMunicionInicial_agregaMunicionAElemento() {
        Jugador j6 = new Jugador("006", "Nacho06", "ACTIVO");
        Dron dron = new Dron(1, 
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
                            j6);  
        Map<Integer, Elemento> elementosEnJuego = new HashMap<>();
        dron.cargarMunicionInicial(elementosEnJuego);
        assertEquals(1, elementosEnJuego.size());
        Elemento elemento = elementosEnJuego.get(0);
        assertTrue(elemento instanceof Municion);
        Municion municion = (Municion) elemento;
        assertEquals(0, municion.getId());
        assertEquals(TipoElemento.AEREO, dron.getTipo());
    }

    @Test   
    void cargarMunicionInicial_noAgregaMunicionSiMapaEsNull() {
        Jugador j7 = new Jugador("007", "Nacho07", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.NAVAL, 
                            j7);  
        dron.cargarMunicionInicial(null);
        assertEquals(0, dron.getMuniciones().size());
    }

    @Test
    void setters_modificanCampos() {
        Jugador j8 = new Jugador("008", "Nacho08", "ACTIVO");
        Dron dron = new Dron(1, 
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
                            j8);  
        dron.setTipo(TipoElemento.NAVAL);
        dron.setBateria(80);
        assertEquals(TipoElemento.NAVAL, dron.getTipo());
        assertEquals(80, dron.getBateria());
    }

    @Test
    void recibeImpacto_cambiaEstadoYVida() {
        Jugador j9 = new Jugador("009", "Nacho09", "ACTIVO");
        Dron dron = new Dron(1, 
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
                            j9);  
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 10f, 20f, 90);
        dron.recibeImpacto(eventoMovimiento);
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
        assertEquals(0, dron.getVida());
    }

    @Test
    void moverse_cambiaPosicion() {
        Jugador j10 = new Jugador("010", "Nacho10", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.NAVAL, 
                            j10);  
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(15f, dron.getPosicionX());
        assertEquals(25f, dron.getPosicionY());
        assertEquals(30f, dron.getPosicionZ());
    }

    @Test
    void moverse_cambiaEstadoAActivo() {
        Jugador j11 = new Jugador("011", "Nacho11", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.INACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.AEREO, 
                            j11);  
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(EstadoElemento.ACTIVO, dron.getEstado());
    }

    @Test
    void disparar_sinMunicionesNoDispara() {
        Jugador j12 = new Jugador("012", "Nacho12", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.NAVAL, 
                            j12);  
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertNull(disparo);
    }

    @Test
    void disparar_conMunicionesDisparaYMarcaMunicionComoUsadaNaval() {
        Jugador j13 = new Jugador("013", "Nacho13", "ACTIVO");
        Dron dron = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            0, 
                            0, 
                            50, 
                            TipoElemento.NAVAL, 
                            j13);  

        dron.agregarMunicion(01);
        dron.agregarMunicion(02);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertTrue(disparo instanceof Misil);
        Municion municion = (Municion) disparo;
        assertTrue(municion.isUsada());
        Elemento disparo2 = dron.disparar(eventoDisparo);
        assertTrue(disparo2 instanceof Misil);
        Municion municion2 = (Municion) disparo2;
        assertTrue(municion2.isUsada());
    }

    @Test
    void disparar_conMunicionesDisparaYMarcaMunicionComoUsadaAereo() {
        Jugador j13 = new Jugador("013", "Nacho13", "ACTIVO");
        Dron dron = new Dron(1, 
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
                            j13);  

        dron.agregarMunicion(01);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertTrue(disparo instanceof Bomba);
        Municion municion = (Municion) disparo;
        assertTrue(municion.isUsada());
    }


}
