package com.Proyecto.SpringBoot.Logica;

import java.util.Dictionary;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class SesionJuego extends GameLoop {

    private String idSesion;
    private Map<Jugador, PortaDron> elementosJugadores;
    private Map<Integer, Elemento> elementosEnJuego;
    private List<Evento> accionesPendientesEnviar;
    private List<Evento> accionesPendientesProcesar;

    private iFachada fachada;

    public SesionJuego(String idSesion, List<Jugador> jugadores, iFachada fachada) {
        this.idSesion = idSesion;
        this.fachada = fachada;
        this.elementosJugadores = new java.util.Hashtable<Jugador, PortaDron>();
        for(Jugador jugador : jugadores) {
            this.elementosJugadores.put(jugador, crearPortaDronParaJugador(jugador));
        }
        elementosEnJuego = new java.util.Hashtable<Integer, Elemento>();
        accionesPendientesEnviar = new java.util.ArrayList<Evento>();
        accionesPendientesProcesar = new java.util.ArrayList<Evento>();
    }

    private PortaDron crearPortaDronParaJugador(Jugador jugador) {
        // Corregir Logica
        return new PortaDron(0, 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0, TipoElemento.AEREO, jugador);
    }

    public void iniciarSesion() {
        
        int i = 0;


        //Recorro la lista de jugadores y les creo los portadrones y drones.
        for(int h = 0; h<elementosJugadores.size(); h++) {
            Jugador jugador = (Jugador) elementosJugadores.keySet().toArray()[h];

            if(i%2 == 0) {
                PortaDron p = new PortaDron(elementosEnJuego.size(), 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0, TipoElemento.AEREO, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);


                int j = 0;
                while(j< 12)
                {
                    Dron d = new Dron(elementosEnJuego.size(), 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0, TipoElemento.AEREO, jugador);
                    elementosEnJuego.put(d.getId(), d);
                    int idMunicion = elementosEnJuego.size();
                    elementosEnJuego.put(idMunicion, d.agregarMunicion(idMunicion));
                    
                    p.AgregarDron(d);
                    j++;
                }
            } else {
                PortaDron p = new PortaDron(elementosEnJuego.size(), 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0, TipoElemento.NAVAL, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);

                int j = 0;
                while(j< 12)
                {
                    Dron d = new Dron(elementosEnJuego.size(), 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0, TipoElemento.NAVAL, jugador);
                    elementosEnJuego.put(d.getId(), d);
                    int idMunicion = elementosEnJuego.size();
                    elementosEnJuego.put(idMunicion, d.agregarMunicion(idMunicion));

                    p.AgregarDron(d);
                    j++;
                }
            }

            i++;
        }

        List<PortaDron> portaDrones = new java.util.ArrayList<PortaDron>();
        elementosJugadores.forEach((jugador, portaDron) -> {
            portaDrones.add(portaDron);
        });

        fachada.EnviarInicioPartida(portaDrones);
        //startGameLoop();
    }

    public String getIdSesion() {
        return idSesion;
    }

    public Map<Jugador, PortaDron> getElementosJugadores() {
        return elementosJugadores;
    }

    public Map<Integer, Elemento> getElementosEnJuego() {
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