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
    private Mapa mapa;
    private String ganadorID;

    private iFachada fachada;

    public SesionJuego(String idSesion, List<Jugador> jugadores, iFachada fachada) {
        this.mapa = new Mapa();
        this.idSesion = idSesion;
        this.fachada = fachada;
        this.elementosJugadores = new java.util.Hashtable<Jugador, PortaDron>();
        for (Jugador jugador : jugadores) {
            this.elementosJugadores.put(jugador, crearPortaDronParaJugador(jugador));
        }
        elementosEnJuego = new java.util.Hashtable<Integer, Elemento>();
        accionesPendientesEnviar = new java.util.ArrayList<Evento>();
        accionesPendientesProcesar = new java.util.ArrayList<Evento>();
    }

    // Sabine: traté de corregirla, chequear que esté bien, por fa.
    private PortaDron crearPortaDronParaJugador(Jugador jugador) {
        TipoElemento tipoJugador = obtenerTipoElementoJugador(jugador);
        return new PortaDron(0, 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0, tipoJugador, jugador);
    }

    private TipoElemento obtenerTipoElementoJugador(Jugador jugador) {
        if (jugador == null || jugador.getTeam() == null) {
            return TipoElemento.NAVAL;
        }

        String team = jugador.getTeam().trim().toUpperCase();
        if ("AEREO".equals(team)) {
            return TipoElemento.AEREO;
        }

        return TipoElemento.NAVAL;
    }

    public void iniciarSesion() {
        // Recorro la lista de jugadores y les creo los portadrones y drones.
        for (int h = 0; h < elementosJugadores.size(); h++) {
            Jugador jugador = (Jugador) elementosJugadores.keySet().toArray()[h];
            TipoElemento tipoJugador = obtenerTipoElementoJugador(jugador);

            if (tipoJugador == TipoElemento.AEREO) {
                PortaDron p = new PortaDron(elementosEnJuego.size(), 0f, 0f, 99f, 0, 100, EstadoElemento.ACTIVO, 0, 0,
                        0,
                        TipoElemento.AEREO, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);

                int j = 0;
                while (j < 12) {
                    Dron d = new Dron(elementosEnJuego.size(), 0f, 0f, 100f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0,
                            TipoElemento.AEREO, jugador);
                    elementosEnJuego.put(d.getId(), d);
                    d.cargarMunicionInicial(elementosEnJuego);

                    p.AgregarDron(d);
                    j++;
                }
            } else {
                PortaDron p = new PortaDron(elementosEnJuego.size(), 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0,
                        TipoElemento.NAVAL, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);

                int j = 0;
                while (j < 6) {
                    Dron d = new Dron(elementosEnJuego.size(), 0f, 0f, 1f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0,
                            TipoElemento.NAVAL, jugador);
                    elementosEnJuego.put(d.getId(), d);
                    d.cargarMunicionInicial(elementosEnJuego);

                    p.AgregarDron(d);
                    j++;
                }
            }
        }

        List<PortaDron> portaDrones = new java.util.ArrayList<PortaDron>();
        elementosJugadores.forEach((jugador, portaDron) -> {
            portaDrones.add(portaDron);
        });

        fachada.EnviarInicioPartida(portaDrones, mapa);
        // startGameLoop();
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

    public boolean agregarEvento(Evento ev) {
        accionesPendientesProcesar.add(ev);
        return true;
    }

    @Override
    protected void processInput(Evento intencion) {
        switch (intencion.getClass().getSimpleName()) {
            case "Evento_Movimiento":
                Evento_Movimiento eventoMovimiento = (Evento_Movimiento) intencion;
                Dron dron = (Dron) elementosEnJuego.get(intencion.getIdElemento());
                if (dron.getEstado() != EstadoElemento.ACTIVO || dron.getBateria() <= 0 || dron.getVida() <= 0 ) {
                    return;
                }
                eventoMovimiento.habilitar();
                break;
            case "Evento_Disparo":
                Evento_Disparo eventoDisparo = (Evento_Disparo) intencion;
                Dron dronDisparador = (Dron) elementosEnJuego.get(intencion.getIdElemento());
                if (dronDisparador.getEstado() != EstadoElemento.ACTIVO ||
                        dronDisparador.getBateria() <= 0 ||
                        dronDisparador.getVida() <= 0 ||
                        dronDisparador.cantidadMunicionesDisponibles() <= 0) {
                    return;
                }
                Elemento municion = dronDisparador.disparar(eventoDisparo);
                if (municion != null) {
                    elementosEnJuego.put(municion.getId(), municion);
                    eventoDisparo.habilitar();
                }
                break;
            case "Evento_Recarga":
                Evento_Recarga eventoRecarga = (Evento_Recarga) intencion;
                Dron dronRecarga = (Dron) elementosEnJuego.get(intencion.getIdElemento());
                if (dronRecarga == null) {
                    return;
                }
                if (dronRecarga.getEstado() != EstadoElemento.ACTIVO || dronRecarga.getBateria() <= 0
                        || dronRecarga.getVida() <= 0) {
                    return;
                }
                eventoRecarga.habilitar();
                break;
            case "Evento_DesplegarDron":
                Evento_DesplegarDron eventoDesplegarDron = (Evento_DesplegarDron) intencion;
                PortaDron portaDron = (PortaDron) elementosEnJuego.get(intencion.getIdElemento());
                if (portaDron == null || portaDron.getEstado() != EstadoElemento.ACTIVO
                        || portaDron.cantidadDronesDisponibles() <= 0) {
                    return;
                }
                eventoDesplegarDron.habilitar();
                break;

            default:
                System.out.println("Acción desconocida: " + intencion.getClass().getSimpleName());
        }
    }

    private void update(Evento accion) {
        switch (accion.getClass().getSimpleName()) {
            case "Evento_Movimiento":
                if (accion.estaHabilitado()) {
                    Evento_Movimiento eventoMovimiento = (Evento_Movimiento) accion;
                    Dron dron = (Dron) elementosEnJuego.get(accion.getIdElemento());
                    dron.moverse(eventoMovimiento);
                }
                this.accionesPendientesEnviar.add(accion);
                break;
            case "Evento_Disparo":
                if (accion.estaHabilitado()) {
                    Evento_Disparo eventoDisparo = (Evento_Disparo) accion;
                    Dron dronDisparador = (Dron) elementosEnJuego.get(accion.getIdElemento());
                    Elemento municion = dronDisparador.disparar(eventoDisparo);
                    if (municion != null) {
                        elementosEnJuego.put(municion.getId(), municion);
                    }
                    Evento_Movimiento eventoMovimientoMunicion = new Evento_Movimiento();
                    municion.moverse(eventoMovimientoMunicion);
                    processInput(eventoMovimientoMunicion);
                    accion.deshabilitar();
                }
                this.accionesPendientesEnviar.add(accion);
                break;
            case "Evento_Recarga":
                if (accion.estaHabilitado()) {
                    Evento_Recarga eventoRecarga = (Evento_Recarga) accion;
                    Dron dronRecarga = (Dron) elementosEnJuego.get(accion.getIdElemento());
                    eventoRecarga.comenzarCarga(dronRecarga);
                    if (dronRecarga.getBateria() < dronRecarga.getMAX_BATERIA()) {
                        dronRecarga.recargar(eventoRecarga);
                    } else if (dronRecarga.cantidadMunicionesDisponibles() < 1
                            && dronRecarga.getTipo() == TipoElemento.AEREO) {
                        dronRecarga.recargaMunicion(eventoRecarga);
                    } else if (dronRecarga.cantidadMunicionesDisponibles() < 2
                            && dronRecarga.getTipo() == TipoElemento.NAVAL) {
                        dronRecarga.recargaMunicion(eventoRecarga);
                    }
                }
                this.accionesPendientesEnviar.add(accion);
                break;
            case "Evento_DesplegarDron":
                if (accion.estaHabilitado()) {
                    Evento_DesplegarDron eventoDesplegarDron = (Evento_DesplegarDron) accion;
                    PortaDron portaDron = (PortaDron) elementosEnJuego.get(accion.getIdElemento());
                    portaDron.getEstado().equals(EstadoElemento.INACTIVO);
                    Dron dronDesplegado = portaDron.desplegarDron(eventoDesplegarDron);
                    if (dronDesplegado != null) {
                        elementosEnJuego.put(dronDesplegado.getId(), dronDesplegado);
                        dronDesplegado.descargaBateria();
                    }
                }
                this.accionesPendientesEnviar.add(accion);
                break;

            default:
                break;
        }
        if (this.finalizarSesion()) {
                
        }

    }

    public boolean finalizarSesion() {
        boolean finalizo = false;
        for (PortaDron portaDron : elementosJugadores.values()) {
            if (portaDron.getEstado() == EstadoElemento.DESTRUIDO
                    && portaDron.cantidadDronesDestruidos() <= portaDron.drones.size()) {
                finalizo = true;
            }
        }
        if (finalizo) {
            for (Jugador jugador : elementosJugadores.keySet()) {
                PortaDron portaDron = elementosJugadores.get(jugador);
                if (portaDron.getEstado() != EstadoElemento.DESTRUIDO) {
                    setGanador(jugador.getId());
                    break;
                }
            }
        }
        return true;
    }

    private void setGanador(String idJugadorGanador) {
        this.ganadorID = idJugadorGanador;
    }

    private String getGanador() {
        return this.ganadorID;
    }

    /// Agregado para que no dé más error, si no no puedo probar front
    @Override
    protected void update(long tiempoTranscurrido) {
        // TODO Auto-generated method stub

    }

    @Override
    protected void update(long deltaTime) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'update'");
    }

}