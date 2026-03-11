package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class PortaDronTest {

    @Test
    public void testConstructor() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001, 
                                        10f, 
                                        20f, 
                                        30f, 
                                        90, 
                                        100, 
                                        EstadoElemento.ACTIVO, 
                                       
                                        TipoElemento.AEREO, 
                                        j1);
        assertEquals(001, portaDron.getId());
        assertEquals(10f, portaDron.getPosicionX());
        assertEquals(20f, portaDron.getPosicionY());
        assertEquals(30f, portaDron.getPosicionZ());
        assertEquals(90, portaDron.getAngulo());
        assertEquals(100, portaDron.getVida());
        assertEquals(EstadoElemento.ACTIVO, portaDron.getEstado());
        assertEquals(j1, portaDron.getJugador());
        assertEquals(TipoElemento.AEREO, portaDron.getTipo());
        assertEquals(0, portaDron.getDrones().size());
    }

    @Test
    public void testAgregarDron() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001, 
                                        10f, 
                                        20f, 
                                        30f, 
                                        90, 
                                        100, 
                                        EstadoElemento.ACTIVO, 
                                     
                                        TipoElemento.AEREO, 
                                        j1);
        Dron dron1 = new Dron(1, 
                            10f, 
                            20f,
                            30f, 
                            90, 
                            100, 
                            EstadoElemento.ACTIVO, 
                            
                            TipoElemento.AEREO, 
                            j1);
        portaDron.AgregarDron(dron1);
        assertEquals(1, portaDron.getDrones().size());
        assertEquals(dron1, portaDron.getDrones().get(0));
    }

    @Test
    public void testSetTipo() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001, 
                                        10f, 
                                        20f, 
                                        30f, 
                                        90, 
                                        100, 
                                        EstadoElemento.ACTIVO, 
                                        
                                        TipoElemento.AEREO, 
                                        j1);
        portaDron.setTipo(TipoElemento.NAVAL);
        assertEquals(TipoElemento.NAVAL, portaDron.getTipo());
    }

    @Test
    public void testRecibeImpactoAereo() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
              
                TipoElemento.AEREO,
                j1);

        Evento_Movimiento evento = new Evento_Movimiento(portaDron, 10f, 20f, 90);
        portaDron.recibeImpacto();
        assertEquals(84, portaDron.getVida());
        assertEquals(EstadoElemento.ACTIVO, portaDron.getEstado());

        // Simular más impactos para destruir el PortaDron
        for (int i = 0; i < 5; i++) {
            portaDron.recibeImpacto();
        }
        assertEquals(0, portaDron.getVida());
        assertEquals(EstadoElemento.DESTRUIDO, portaDron.getEstado());
    }

    @Test
    public void testRecibeImpactoNaval() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
              
                TipoElemento.NAVAL,
                j1);

        Evento_Movimiento evento = new Evento_Movimiento(portaDron, 10f, 20f, 90);
        portaDron.recibeImpacto();
        assertEquals(67, portaDron.getVida());
        assertEquals(EstadoElemento.ACTIVO, portaDron.getEstado());

        // Simular más impactos para destruir el PortaDron
        for (int i = 0; i < 2; i++) {
            portaDron.recibeImpacto();
        }
        assertEquals(0, portaDron.getVida());
        assertEquals(EstadoElemento.DESTRUIDO, portaDron.getEstado());
    }

    @Test
    public void testcantidadDronesDestruidosYDisponibles() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
               
                TipoElemento.AEREO,
                j1);
        Dron dron1 = new Dron(1,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.INACTIVO,
               
                TipoElemento.AEREO,
                j1);
        Dron dron3 = new Dron(3,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.INACTIVO,
               
                TipoElemento.AEREO,
                j1);
        Dron dron2 = new Dron(2,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.DESTRUIDO,
               
                TipoElemento.AEREO,
                j1);
        Dron dron4 = new Dron(4,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.INACTIVO,
                
                TipoElemento.AEREO,
                j1);
        portaDron.AgregarDron(dron1);
        portaDron.AgregarDron(dron2);
        portaDron.AgregarDron(dron3);
        portaDron.AgregarDron(dron4);
        assertEquals(1, portaDron.cantidadDronesDestruidos());
        assertEquals(3, portaDron.cantidadDronesDisponibles());
        dron3.setEstado(EstadoElemento.DESTRUIDO);
        assertEquals(2, portaDron.cantidadDronesDestruidos());
        assertEquals(2, portaDron.cantidadDronesDisponibles());
    }

    @Test
    public void testMoverPortaDron() {
        EntidadJugador j1 = new EntidadJugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001,
                10f,
                20f,
                30f,
                90,
                100,
                EstadoElemento.ACTIVO,
                
                TipoElemento.AEREO,
                j1);
        Evento_Movimiento evento = new Evento_Movimiento(portaDron, 15f, 25f, 180);
        portaDron.moverse(evento);
        assertEquals(15f, portaDron.getPosicionX());
        assertEquals(25f, portaDron.getPosicionY());
        assertEquals(180, portaDron.getAngulo());

    }
}
