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
}
