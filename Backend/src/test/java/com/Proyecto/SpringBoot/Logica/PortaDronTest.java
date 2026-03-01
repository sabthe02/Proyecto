package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class PortaDronTest {
    
    @Test
    public void testConstructor() {
        Jugador j1 = new Jugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001, 
                                        10f, 
                                        20f, 
                                        30f, 
                                        90, 
                                        100, 
                                        EstadoElemento.ACTIVO, 
                                        0, 
                                        0, 
                                        0, 
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
        Jugador j1 = new Jugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001, 
                                        10f, 
                                        20f, 
                                        30f, 
                                        90, 
                                        100, 
                                        EstadoElemento.ACTIVO, 
                                        0, 
                                        0, 
                                        0, 
                                        TipoElemento.AEREO, 
                                        j1);
        Dron dron1 = new Dron(1, 
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
        portaDron.AgregarDron(dron1);
        assertEquals(1, portaDron.getDrones().size());
        assertEquals(dron1, portaDron.getDrones().get(0));
    }

    @Test
    public void testSetTipo() {
        Jugador j1 = new Jugador("001", "Nacho", "ACTIVO");
        PortaDron portaDron = new PortaDron(001, 
                                        10f, 
                                        20f, 
                                        30f, 
                                        90, 
                                        100, 
                                        EstadoElemento.ACTIVO, 
                                        0, 
                                        0, 
                                        0, 
                                        TipoElemento.AEREO, 
                                        j1);
        portaDron.setTipo(TipoElemento.NAVAL);
        assertEquals(TipoElemento.NAVAL, portaDron.getTipo());
    }

}
