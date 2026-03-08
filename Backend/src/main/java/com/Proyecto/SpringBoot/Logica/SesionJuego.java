package com.Proyecto.SpringBoot.Logica;

import java.util.List;
import java.util.Map;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.Excepciones.PartidaException;

public class SesionJuego extends GameLoop {

    private String idSesion;
    private Map<EntidadJugador, PortaDron> elementosJugadores;
    private Map<Integer, Elemento> elementosEnJuego;
    private List<Evento> accionesPendientesEnviar;
    //private List<Evento> accionesPendientesProcesar;
    private List<EntidadJugador> jugadores;
    private Mapa mapa;
    private String ganadorID;

    private iPartidaService notificadorPartida;

    public SesionJuego(String idSesion, List<EntidadJugador> jugadores, iPartidaService notificadorPartida) {
        this.mapa = new Mapa();
        this.idSesion = idSesion;
        this.notificadorPartida = notificadorPartida;
        this.elementosJugadores = new java.util.Hashtable<EntidadJugador, PortaDron>();
        this.jugadores = jugadores;
        for (EntidadJugador jugador : jugadores) {
            this.elementosJugadores.put(jugador, crearPortaDronParaJugador(jugador));
        }
        elementosEnJuego = new java.util.Hashtable<Integer, Elemento>();
        accionesPendientesEnviar = new java.util.ArrayList<Evento>();
    }

    private PortaDron crearPortaDronParaJugador(EntidadJugador jugador) {
        TipoElemento tipoJugador = obtenerTipoElementoJugador(jugador);
        return new PortaDron(0, 0f, 0f, 0f, 0, 100, EstadoElemento.ACTIVO, 0, 0, 0, tipoJugador, jugador);
    }

    private TipoElemento obtenerTipoElementoJugador(EntidadJugador jugador) {
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
        for (int h = 0; h < jugadores.size(); h++) {

            EntidadJugador jugador = (EntidadJugador) jugadores.get(h);

            TipoElemento tipoJugador = TipoElemento.AEREO;
            if ((h + 1) % 2 == 0)
                tipoJugador = TipoElemento.NAVAL;

            if (tipoJugador == TipoElemento.AEREO) {
                jugador.setTeam("AEREO");
                PortaDron p = new PortaDron(elementosEnJuego.size(), 500f, 500f, 99f, 0, 100, EstadoElemento.ACTIVO, 0,
                        0,
                        0,
                        TipoElemento.AEREO, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);

                int j = 0;
                while (j < 12) {
                    // Posicionar drones en círculo alrededor del portadrón AEREO
                    float angulo = (float) (j * 2 * Math.PI / 12);
                    float radioCirculo = 200f;
                    float dronX = 500f + (float) (Math.cos(angulo) * radioCirculo);
                    float dronY = 500f + (float) (Math.sin(angulo) * radioCirculo);

                    // Drones deben comenzar inactivos (dentro del portadron)
                    // Se despliegan con la accion DESPLEGAR
                    Dron d = new Dron(elementosEnJuego.size(), dronX, dronY, 100f, 0, 100, EstadoElemento.INACTIVO, 0,
                            0, 0,
                            TipoElemento.AEREO, jugador);
                    elementosEnJuego.put(d.getId(), d);
                    d.cargarMunicionInicial(elementosEnJuego);

                    p.AgregarDron(d);
                    j++;
                }
            } else {
                jugador.setTeam("AEREO");
                PortaDron p = new PortaDron(elementosEnJuego.size(), 3500f, 3500f, 0f, 0, 100, EstadoElemento.ACTIVO, 0,
                        0, 0,
                        TipoElemento.NAVAL, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);

                int j = 0;
                while (j < 6) {
                    // Posicionar drones en círculo alrededor del portadrón NAVAL
                    float angulo = (float) (j * 2 * Math.PI / 6);
                    float radioCirculo = 200f;
                    float dronX = 3500f + (float) (Math.cos(angulo) * radioCirculo);
                    float dronY = 3500f + (float) (Math.sin(angulo) * radioCirculo);

                    // Drones deben comenzar inactivos (dentro del portadron)
                    // Se despliegan con la accion DESPLEGAR
                    Dron d = new Dron(elementosEnJuego.size(), dronX, dronY, 1f, 0, 100, EstadoElemento.INACTIVO, 0, 0,
                            0,
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

        notificadorPartida.EnviarInicioPartida(portaDrones, mapa);

        iniciar();


        // Enviar estado inicial del juego (elementos creados)
        List<EntidadJugador> jugadores = new java.util.ArrayList<>(elementosJugadores.keySet());
        /* 
        List<Evento> estadoInicial = new java.util.ArrayList<>();

        // Crear eventos de movimiento para todos los elementos creados
        elementosEnJuego.forEach((id, elemento) -> {
            System.out.println("  - Elemento id=" + id + " clase=" + elemento.getClass().getSimpleName() +
                    " tipo="
                    + (elemento instanceof PortaDron ? ((PortaDron) elemento).getTipo()
                            : elemento instanceof Dron ? ((Dron) elemento).getTipo() : "N/A")
                    +
                    " pos=(" + elemento.getPosicionX() + "," + elemento.getPosicionY() + "," + elemento.getPosicionZ()
                    + ")" +
                    " estado=" + elemento.getEstado());
            estadoInicial.add(new Evento_Movimiento(elemento, elemento.getPosicionX(), elemento.getPosicionY(),
                    elemento.getAngulo()));
        });

        System.out.println("Enviando ACTUALIZAR_PARTIDA con " + estadoInicial.size() + " eventos");
        boolean enviado = notificadorPartida.EnviarActualizaciones(jugadores, estadoInicial);
        System.out.println("ACTUALIZAR_PARTIDA enviado=" + enviado);*/

    }

    public String getIdSesion() {
        return idSesion;
    }

    public Map<EntidadJugador, PortaDron> getElementosJugadores() {
        return elementosJugadores;
    }

    public Map<Integer, Elemento> getElementosEnJuego() {
        return elementosEnJuego;
    }

    public List<Evento> getAccionesPendientesEnviar() {
        return accionesPendientesEnviar;
    }

   

    public Elemento getElemento(int idElemento) throws PartidaException {
        Elemento el = elementosEnJuego.get(idElemento);

        if (el == null) {
            throw new PartidaException("El elemento " + idElemento + " no existe en la partida.");
        }

        return el;
    }

    public boolean agregarEvento(Evento ev) {
        agregarEventoEntrada(ev);
        return true;
    }

    @Override
    protected void render() {
        if(accionesPendientesEnviar.size()>0)
        {
            notificadorPartida.EnviarActualizaciones(jugadores, accionesPendientesEnviar);
            accionesPendientesEnviar.clear();
        }
    }

    @Override
    protected void processInput(Evento intencion) {
        switch (intencion.getClass().getSimpleName()) {
            case "Evento_Movimiento":
                Evento_Movimiento eventoMovimiento = (Evento_Movimiento) intencion;
                Elemento elemento = elementosEnJuego.get(intencion.getIdElemento());
                if (elemento.getEstado() != EstadoElemento.ACTIVO ||  elemento.getVida() <= 0) {
                    return;
                }
                if(elemento instanceof Dron)
                {
                    if(elemento.getBateria() <= 0)
                    {
                        return;
                    }
                }
                if (elemento instanceof Misil) {
                    Misil misil = (Misil) elemento;
                    misil.mover(eventoMovimiento);
                    Elemento objetivo = enLaTrayectoria(eventoMovimiento);
                    if (objetivo != null) {
                        objetivo.recibeImpacto(eventoMovimiento);
                        misil.setEstado(EstadoElemento.INACTIVO);
                        return;
                    }
                    if (misil.getDistancia() < misil.getDIS_MAX()) {
                        misil.calculoDeNuevaPosicion();
                        agregarEventoEntrada(new Evento_Movimiento(misil, misil.getPosicionX(),
                                misil.getPosicionY(), misil.getAngulo()));
                    } else {
                        misil.setEstado(EstadoElemento.INACTIVO);
                    }
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
                    Evento_Movimiento eventoMovimientoMunicion = new Evento_Movimiento(municion,
                            municion.getPosicionX(),
                            municion.getPosicionY(),
                            municion.getAngulo());
                    eventoMovimientoMunicion.habilitar();
                    agregarEventoEntrada(eventoMovimientoMunicion);
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

    @Override
    protected void update(Evento accion) {
        switch (accion.getClass().getSimpleName()) {
            case "Evento_Movimiento":
                if (accion.estaHabilitado()) {
                    Evento_Movimiento eventoMovimiento = (Evento_Movimiento) accion;
                    Elemento e = elementosEnJuego.get(accion.getIdElemento());
                    e.moverse(eventoMovimiento);
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
            for (EntidadJugador jugador : elementosJugadores.keySet()) {
                PortaDron portaDron = elementosJugadores.get(jugador);
                if (portaDron.getEstado() != EstadoElemento.DESTRUIDO) {
                    setGanador(jugador.getId());
                    break;
                }
            }
        }
        return true;
    }

    public Elemento enLaTrayectoria(Evento_Movimiento intencion) {
        Elemento elementoAtacante = intencion.getElemento();
        for (PortaDron portaDron : elementosJugadores.values()) {
            if (portaDron.getTipo() != elementoAtacante.getTipo()
                    && portaDron.getEstado() == EstadoElemento.ACTIVO) {
                if (mapa.estaEnLaTrayectoria(intencion.getNuevaPosX(),
                        intencion.getNuevaPosY(), intencion.getNuevaPosZ(),
                        portaDron.getPosicionX(), portaDron.getPosicionY(),
                        portaDron.getPosicionZ())) {
                    return portaDron;
                }
            }
            for (Dron dron : portaDron.getDrones()) {
                if (dron.getTipo() != elementoAtacante.getTipo() && dron.getEstado() == EstadoElemento.ACTIVO) {
                    if (mapa.estaEnLaTrayectoria(intencion.getNuevaPosX(),
                            intencion.getNuevaPosY(), intencion.getNuevaPosZ(),
                            dron.getPosicionX(), dron.getPosicionY(), dron.getPosicionZ())) {
                        return dron;
                    }
                }
            }
        }
        return null;
    }

    public void recibeImpacto(Evento_Movimiento intencion) {
        Elemento elementoAtacado = elementosEnJuego.get(intencion.getIdElemento());
        if (elementoAtacado != null) {
            elementoAtacado.recibeImpacto(intencion);
        }
    }

    private void setGanador(String idJugadorGanador) {
        this.ganadorID = idJugadorGanador;
    }

    private String getGanador() {
        return this.ganadorID;
    }

   
}