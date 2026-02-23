package com.Proyecto.SpringBoot.Logica;

import java.util.Dictionary;
import java.util.List;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class SesionJuego extends GameLoop {

    private String idSesion;
    private Dictionary<String, Jugador> jugadores;
    private Dictionary<String, Elemento> elementosEnJuego;
    private List<Evento> accionesPendientesEnviar;
    private List<Evento> accionesPendientesProcesar;

    public SesionJuego(String idSesion, List<Jugador> jugadores) {
        this.idSesion = idSesion;
        this.jugadores = new java.util.Hashtable<String, Jugador>();
        for(Jugador jugador : jugadores) {
            this.jugadores.put(jugador.getId(), jugador);
        }
        elementosEnJuego = new java.util.Hashtable<String, Elemento>();
        accionesPendientesEnviar = new java.util.ArrayList<Evento>();
        accionesPendientesProcesar = new java.util.ArrayList<Evento>();


        // Enviar notificacion a jugadores de inicio de sesion

        
    }

    public String getIdSesion() {
        return idSesion;
    }

    public Dictionary<String, Jugador> getJugadores() {
        return jugadores;
    }

    public Dictionary<String, Elemento> getElementosEnJuego() {
        return elementosEnJuego;
    }

    public List<Evento> getAccionesPendientesEnviar() {
        return accionesPendientesEnviar;
    }

    public List<Evento> getAccionesPendientesProcesar() {
        return accionesPendientesProcesar;
    }



    @Override
    protected void processGameLoop() {
        while (isGameRunning()) {

            while (!accionesPendientesProcesar.isEmpty()) {
                Evento accion = accionesPendientesProcesar.remove(0);

                processInput(accion);
                update(accion);
                // Procesar la acción y actualizar el estado del juego
            }

            render();
        }
        throw new UnsupportedOperationException("Unimplemented method 'processGameLoop'");
    }


    @Override
    protected void processInput(Evento accion) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'processInput'");
    }

    private void update(Evento accion) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'update'");

    }

}