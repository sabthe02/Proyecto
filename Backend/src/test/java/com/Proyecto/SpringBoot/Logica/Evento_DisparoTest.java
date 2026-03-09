package com.Proyecto.SpringBoot.Logica;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Evento_DisparoTest {
    
    @Test
    public void testEventoDisparo() {
        EntidadJugador j8 = new EntidadJugador("008", "Nacho08", "ACTIVO");
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
                            j8); 
        Evento_Disparo evento = new Evento_Disparo(elemento);
        assertEquals(1, evento.getIdElemento());
    }
}
