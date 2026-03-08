package com.Proyecto.SpringBoot.Logica;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class SesionJuegoTest {

    SesionJuego sesion;

    @Test
    void inicioPartida()
    {
        

        List<EntidadJugador> lista = new ArrayList<>();
        lista.add(new EntidadJugador("Test2", "team1"));
        lista.add( new EntidadJugador("Test1", "team2"));


        

       
        
        sesion = new SesionJuego("sesion1", lista,  new iPartidaService() {


            @Override
            public boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones) {
                String s = ";";
                return true;
            }

            @Override
            public boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa) {
                
                Evento_Movimiento mov = new Evento_Movimiento();
                mov.elemento = portaDrones.get(0);
                mov.setNuevaPosX(1f);
                mov.setNuevaPosY(1f);
                mov.setNuevoAngulo(10);

                sesion.agregarEvento(mov);

                return true;
            }

            @Override
            public void EnviarFinPartida(String ganador) {
                
                
            }
            
        });
        sesion.iniciarSesion();
    }
    
}
