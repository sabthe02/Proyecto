package com.Proyecto.SpringBoot.Logica;

import java.util.Dictionary;
import java.util.Iterator;
import java.util.List;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class SesionJuego extends GameLoop {

    private String idSesion;
    private Dictionary<Jugador, PortaDron> elementosJugadores;
    private Dictionary<Integer, Elemento> elementosEnJuego;
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

        Iterator<Jugador> it = elementosJugadores.keys().asIterator();
        while(it.hasNext()) {
            Jugador jugador = it.next();
           

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
                    j++;
                }
            }

            i++;
        }

        List<PortaDron> portaDrones = new java.util.ArrayList<PortaDron>();
        Iterator<PortaDron> itValues = elementosJugadores.elements().asIterator();
        while(itValues.hasNext()) {
            PortaDron p = itValues.next();
            portaDrones.add(p);
        }

        fachada.EnviarInicioPartida(portaDrones);
        //startGameLoop();
    }

    public String getIdSesion() {
        return idSesion;
    }

    public Dictionary<Jugador, PortaDron> getElementosJugadores() {
        return elementosJugadores;
    }

    public Dictionary<Integer, Elemento> getElementosEnJuego() {
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