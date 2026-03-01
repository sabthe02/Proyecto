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
        assertEquals(50, dron.getBateria());
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
        assertEquals(50, dron.getBateria());
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


}
