package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

import org.junit.jupiter.api.Test;

public class Evento_DesplegarDronTest {
    
    @Test
    void constructor_porDefecto() {
        Evento_DesplegarDron evento = new Evento_DesplegarDron();
        assertNull(evento.getElemento());
    }

    @Test
    void constructor_completo() {
        EntidadJugador j1 = new EntidadJugador("008", "Nacho08", "ACTIVO");
        Dron elemento = new Dron(1, 
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
                            j1); 
        Evento_DesplegarDron evento = new Evento_DesplegarDron(elemento);
        assertEquals(elemento, evento.getElemento());
        assertEquals(1, evento.getIdElemento());
    }
}
