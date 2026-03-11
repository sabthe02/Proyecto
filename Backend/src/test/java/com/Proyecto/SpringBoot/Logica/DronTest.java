package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.yaml.snakeyaml.events.Event;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DronTest {

    @Test
    void constructor_seteaCamposAereo() {
        EntidadJugador j1 = new EntidadJugador("id-1", "Nacho", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
               
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
        EntidadJugador j1 = new EntidadJugador("id-1", "Nacho", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
               
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
        EntidadJugador j2 = new EntidadJugador("002", "Nacho02", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j2);
        dron.agregarMunicion(1);
        assertEquals(1, dron.cantidadMunicionesDisponibles());
        assertEquals(0, dron.cantidadMunicionesUsadas());

    }

    @Test
    void agregarMunicion_agregaMisil() {
        EntidadJugador j3 = new EntidadJugador("003", "Nacho03", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j3);
        dron.agregarMunicion(1);
        assertEquals(1, dron.cantidadMunicionesDisponibles());
        assertEquals(0, dron.cantidadMunicionesUsadas());
    }

    @Test
    void cantidadMunicionesUsadas_cuentaCorrectamente() {
        EntidadJugador j4 = new EntidadJugador("004", "Nacho04", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
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
        EntidadJugador j5 = new EntidadJugador("005", "Nacho05", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
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
        EntidadJugador j6 = new EntidadJugador("006", "Nacho06", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
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
        EntidadJugador j7 = new EntidadJugador("007", "Nacho07", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                TipoElemento.NAVAL,
                j7);
        dron.cargarMunicionInicial(null);
        assertEquals(0, dron.getMuniciones().size());
    }

    @Test
    void setters_modificanCampos() {
        EntidadJugador j8 = new EntidadJugador("008", "Nacho08", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j8);
        dron.setTipo(TipoElemento.NAVAL);
        dron.setBateria(80);
        assertEquals(TipoElemento.NAVAL, dron.getTipo());
        assertEquals(80, dron.getBateria());
    }

    @Test
    void recibeImpacto_cambiaEstadoYVida() {
        EntidadJugador j9 = new EntidadJugador("009", "Nacho09", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                TipoElemento.AEREO,
                j9);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 10f, 20f, 90);
        dron.recibeImpacto();
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
        assertEquals(0, dron.getVida());
    }

    @Test
    void moverse_cambiaPosicion() {
        EntidadJugador j10 = new EntidadJugador("010", "Nacho10", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
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
        EntidadJugador j11 = new EntidadJugador("011", "Nacho11", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.INACTIVO,
                
                TipoElemento.AEREO,
                j11);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(EstadoElemento.ACTIVO, dron.getEstado());
    }

    @Test
    void disparar_sinMunicionesNoDispara() {
        EntidadJugador j12 = new EntidadJugador("012", "Nacho12", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j12);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertNull(disparo);
    }

    @Test
    void disparar_conMunicionesDisparaYMarcaMunicionComoUsadaNaval() {
        EntidadJugador j13 = new EntidadJugador("013", "Nacho13", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
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
        EntidadJugador j13 = new EntidadJugador("013", "Nacho13", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j13);

        dron.agregarMunicion(01);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertTrue(disparo instanceof Bomba);
        Municion municion = (Municion) disparo;
        assertTrue(municion.isUsada());
    }

    @Test
    void disparar_conMunicionesAgotadasNoDispara() {
        EntidadJugador j14 = new EntidadJugador("014", "Nacho14", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j14);

        dron.agregarMunicion(01);
        dron.agregarMunicion(02);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        dron.disparar(eventoDisparo);
        dron.disparar(eventoDisparo);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertNull(disparo);
    }

    @Test
    void disparar_conMunicionesAgotadasNoDisparaAereo() {
        EntidadJugador j14 = new EntidadJugador("014", "Nacho14", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j14);

        dron.agregarMunicion(01);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        dron.disparar(eventoDisparo);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertNull(disparo);
    }

    @Test
    void recargar_conEstadoCargandoRecargaBateria() {
        EntidadJugador j15 = new EntidadJugador("015", "Nacho15", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.CARGANDO,
                
                TipoElemento.AEREO,
                j15);
        dron.setBateria(900);
        Evento_Recarga eventoRecarga = new Evento_Recarga(dron);
        dron.recargar(eventoRecarga);
        assertEquals(901, dron.getBateria());
    }

    @Test
    void recargar_conEstadoNoCargandoNoRecargaBateria() {
        EntidadJugador j16 = new EntidadJugador("016", "Nacho16", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j16);
        dron.setBateria(900);
        Evento_Recarga eventoRecarga = new Evento_Recarga(dron);
        dron.recargar(eventoRecarga);
        assertEquals(900, dron.getBateria());
    }

    @Test
    void recargar_conEstadoCargandoAlcanzaBateriaMaxima() {
        EntidadJugador j17 = new EntidadJugador("017", "Nacho17", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.CARGANDO,
                
                TipoElemento.AEREO,
                j17);
        dron.setBateria(999);
        Evento_Recarga eventoRecarga = new Evento_Recarga(dron);
        dron.recargar(eventoRecarga);
        assertEquals(1000, dron.getBateria());
        assertFalse(eventoRecarga.estaHabilitado());
    }

    @Disabled("test duplicado")
    @Test
    void recargar_conEstadoCargandoAlcanzaBateriaMaximaYDeshabilitaEvento() {
        EntidadJugador j18 = new EntidadJugador("018", "Nacho18", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.CARGANDO,
                
                TipoElemento.NAVAL,
                j18);
        dron.setBateria(999);
        Evento_Recarga eventoRecarga = new Evento_Recarga(dron);
        dron.recargar(eventoRecarga);
        assertEquals(1000, dron.getBateria());
        assertFalse(eventoRecarga.estaHabilitado());
    }

    @Test
    void consumirBateria_conEstadoActivo() {
        EntidadJugador j19 = new EntidadJugador("019", "Nacho19", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j19);
        dron.consumirBateriaPorMovimiento();
        assertEquals(999, dron.getBateria());
    }

    @Test
    void consumirBateria_conEstadoNoActivoNoConsumeBateria() {
        EntidadJugador j20 = new EntidadJugador("020", "Nacho20", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.DESTRUIDO,
                
                TipoElemento.NAVAL,
                j20);
        dron.consumirBateriaPorMovimiento();
        assertEquals(1000, dron.getBateria());
    }

    @Test
    void consumirBateria_conEstadoActivoAlcanzaCeroYDestruyeDron() {
        EntidadJugador j21 = new EntidadJugador("021", "Nacho21", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j21);
        dron.setBateria(1);
        dron.consumirBateriaPorMovimiento();
        assertEquals(0, dron.getBateria());
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
    }

    @Test
    void consumirBateria_conEstadoActivoAlcanzaCeroYDestruyeDronNaval() {
        EntidadJugador j22 = new EntidadJugador("022", "Nacho22", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j22);
        dron.setBateria(1);
        dron.consumirBateriaPorMovimiento();
        assertEquals(0, dron.getBateria());
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
    }

    @Disabled("Este test no aplica dado que la restricción del movimiento esta en sesiondejuego y no en el dron, pero lo dejo por las dudas")
    @Test
    void moverse_conBateriaAgotadaNoCambiaPosicion() {
        EntidadJugador j23 = new EntidadJugador("023", "Nacho23", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j23);
        dron.setBateria(0);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(10f, dron.getPosicionX());
        assertEquals(20f, dron.getPosicionY());
        assertEquals(30f, dron.getPosicionZ());
    }

    @Disabled("Este test no aplica dado que la restricción del movimiento esta en sesiondejuego y no en el dron, pero lo dejo por las dudas")
    @Test
    void moverse_conBateriaAgotadaNoCambiaPosicionNaval() {
        EntidadJugador j24 = new EntidadJugador("024", "Nacho24", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j24);
        dron.setBateria(0);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(10f, dron.getPosicionX());
        assertEquals(20f, dron.getPosicionY());
        assertEquals(30f, dron.getPosicionZ());
    }

    @Test
    void moverse_conBateriaDisponibleConsumeBateria() {
        EntidadJugador j25 = new EntidadJugador("025", "Nacho25", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j25);
        dron.setBateria(1000);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(999, dron.getBateria());
    }

    @Test
    void moverse_conBateriaDisponibleConsumeBateriaNaval() {
        EntidadJugador j26 = new EntidadJugador("026", "Nacho26", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j26);
        dron.setBateria(1000);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(999, dron.getBateria());
    }

    @Test
    void moverse_conBateriaDisponibleCambiaEstadoAActivo() {
        EntidadJugador j27 = new EntidadJugador("027", "Nacho27", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.INACTIVO,
                
                TipoElemento.AEREO,
                j27);
        dron.setBateria(1000);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(EstadoElemento.ACTIVO, dron.getEstado());
    }

    @Test
    void moverse_conBateriaDisponibleCambiaEstadoAActivoNaval() {
        EntidadJugador j28 = new EntidadJugador("028", "Nacho28", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.INACTIVO,
                
                TipoElemento.NAVAL,
                j28);
        dron.setBateria(1000);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(EstadoElemento.ACTIVO, dron.getEstado());
    }

    @Test
    void moverse_conBateriaDisponibleCambiaPosicion() {
        EntidadJugador j29 = new EntidadJugador("029", "Nacho29", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j29);
        dron.setBateria(1000);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(15f, dron.getPosicionX());
        assertEquals(25f, dron.getPosicionY());
        assertEquals(30f, dron.getPosicionZ());
    }

    @Test
    void moverse_conBateriaDisponibleCambiaPosicionNaval() {
        EntidadJugador j30 = new EntidadJugador("030", "Nacho30", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j30);
        dron.setBateria(1000);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(15f, dron.getPosicionX());
        assertEquals(25f, dron.getPosicionY());
    }

    @Test
    void moverse_conBateriaAgotadaNoCambiaEstado() {
        EntidadJugador j31 = new EntidadJugador("031", "Nacho31", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.DESTRUIDO,
                
                TipoElemento.AEREO,
                j31);
        dron.setBateria(0);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
    }

    @Test
    void moverse_conBateriaAgotadaNoCambiaEstadoNaval() {
        EntidadJugador j32 = new EntidadJugador("032", "Nacho32", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.DESTRUIDO,
                
                TipoElemento.NAVAL,
                j32);
        dron.setBateria(0);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento);
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
    }

    @Test
    void recibeImpacto_noMueve() {
        EntidadJugador j9 = new EntidadJugador("009", "Nacho09", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j9);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 10f, 20f, 90);
        dron.recibeImpacto();
        Evento_Movimiento eventoMovimiento2 = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento2);
        assertFalse(eventoMovimiento2.estaHabilitado());
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
        assertEquals(0, dron.getVida());
    }

    @Test
    void recibeImpacto_noMueveNaval() {
        EntidadJugador j9 = new EntidadJugador("009", "Nacho09", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j9);
        Evento_Movimiento eventoMovimiento = new Evento_Movimiento(dron, 10f, 20f, 90);
        dron.recibeImpacto();
        Evento_Movimiento eventoMovimiento2 = new Evento_Movimiento(dron, 15f, 25f, 90);
        dron.moverse(eventoMovimiento2);
        assertFalse(eventoMovimiento2.estaHabilitado());
        assertEquals(EstadoElemento.DESTRUIDO, dron.getEstado());
        assertEquals(0, dron.getVida());
    }

    @Test
    void disparar_conMunicionUsadaNoDispara() {
        EntidadJugador j13 = new EntidadJugador("013", "Nacho13", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j13);

        dron.agregarMunicion(01);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertTrue(disparo instanceof Bomba);
        Municion municion = (Municion) disparo;
        assertTrue(municion.isUsada());
        Elemento disparo2 = dron.disparar(eventoDisparo);
        assertNull(disparo2);
    }

    @Test
    void disparar_conMunicionUsadaNoDisparaNaval() {
        EntidadJugador j13 = new EntidadJugador("013", "Nacho13", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j13);

        dron.agregarMunicion(01);
        Evento_Disparo eventoDisparo = new Evento_Disparo(dron);
        Elemento disparo = dron.disparar(eventoDisparo);
        assertTrue(disparo instanceof Misil);
        Municion municion = (Municion) disparo;
        assertTrue(municion.isUsada());
        Elemento disparo2 = dron.disparar(eventoDisparo);
        assertNull(disparo2);
    }

    @Test
    void comenzandoCarga_conEstadoCargandoPermiteRecargar() {
        EntidadJugador j33 = new EntidadJugador("033", "Nacho33", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.CARGANDO,
                
                TipoElemento.AEREO,
                j33);

        assertEquals(0, dron.getComenzandoCarga());
    }

    @Test
    void comenzandoCarga_conEstadoNoCargandoNoPermiteRecargar() {
        EntidadJugador j34 = new EntidadJugador("034", "Nacho34", "ACTIVO");
        Dron dron = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.NAVAL,
                j34);
        dron.recargar(new Evento_Recarga(dron));
        assertEquals(0, dron.getComenzandoCarga());
    }

}
