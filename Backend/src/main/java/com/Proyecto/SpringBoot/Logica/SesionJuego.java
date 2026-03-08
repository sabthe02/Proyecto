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

  
    private PortaDron crearPortaDronParaJugador(Jugador jugador) {
        TipoElemento tipoJugador = obtenerTipoElementoJugador(jugador);
        
        // Calcular HP segun tipo:
        // AEREO: atacado por misiles (50 dano) - debe resistir 6 misiles = 6 * 50 = 300
        // NAVAL: atacado por bombas (100 dano) - debe resistir 3 bombas = 3 * 100 = 300
        int vidaPortadron;
        if (tipoJugador == TipoElemento.AEREO) {
            vidaPortadron = 6 * 50; // 6 misiles
        } else {
            vidaPortadron = 3 * 100; // 3 bombas
        }
        
        return new PortaDron(0, 0f, 0f, 0f, 0, vidaPortadron, EstadoElemento.ACTIVO, 0, 0, 0, tipoJugador, jugador);
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
            System.out.println("iniciarSesion - Jugador: " + jugador.getNickName() + ", Team: " + jugador.getTeam());
            TipoElemento tipoJugador = obtenerTipoElementoJugador(jugador);
            System.out.println("Tipo asignado: " + tipoJugador);

            if (tipoJugador == TipoElemento.AEREO) {
                // Debe resistir 6 impactos de misil
                PortaDron p = new PortaDron(elementosEnJuego.size(), 500f, 500f, 99f, 0, 300, EstadoElemento.ACTIVO, 0, 0,
                        0,
                        TipoElemento.AEREO, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);

                int j = 0;
                while (j < 12) {
                    // Posicionar drones en círculo alrededor del portadrón AEREO
                    float angulo = (float)(j * 2 * Math.PI / 12);
                    float radioCirculo = 200f;
                    float dronX = 500f + (float)(Math.cos(angulo) * radioCirculo);
                    float dronY = 500f + (float)(Math.sin(angulo) * radioCirculo);
                    
                    // Drones deben comenzar inactivos (dentro del portadron)
                    // Se despliegan con la accion DESPLEGAR
                    Dron d = new Dron(elementosEnJuego.size(), dronX, dronY, 100f, 0, 100, EstadoElemento.INACTIVO, 0, 0, 0,
                            TipoElemento.AEREO, jugador);
                    elementosEnJuego.put(d.getId(), d);
                    d.cargarMunicionInicial(elementosEnJuego);

                    p.AgregarDron(d);
                    j++;
                }
            } else {
                // Debe resistir 3 impactos de bomba
                PortaDron p = new PortaDron(elementosEnJuego.size(), 3500f, 3500f, 0f, 0, 300, EstadoElemento.ACTIVO, 0, 0, 0,
                        TipoElemento.NAVAL, jugador);
                elementosEnJuego.put(p.getId(), p);
                elementosJugadores.put(jugador, p);

                int j = 0;
                while (j < 6) {
                    // Posicionar drones en círculo alrededor del portadrón
                    float angulo = (float)(j * 2 * Math.PI / 6);
                    float radioCirculo = 200f;
                    float dronX = 3500f + (float)(Math.cos(angulo) * radioCirculo);
                    float dronY = 3500f + (float)(Math.sin(angulo) * radioCirculo);
                    
                    // Drones deben comenzar inactivos (dentro del portadron)
                    // Se despliegan con la accion DESPLEGAR
                    Dron d = new Dron(elementosEnJuego.size(), dronX, dronY, 1f, 0, 100, EstadoElemento.INACTIVO, 0, 0, 0,
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
        
        // Enviar estado inicial del juego (elementos creados)
        List<Jugador> jugadores = new java.util.ArrayList<>(elementosJugadores.keySet());
        List<Evento> estadoInicial = new java.util.ArrayList<>();
        
        System.out.println("=== ESTADO INICIAL DEL JUEGO ===");
        System.out.println("Total elementos en juego: " + elementosEnJuego.size());
        
        // Crear eventos de movimiento para todos los elementos creados
        elementosEnJuego.forEach((id, elemento) -> {
            String tipo;
            if (elemento instanceof PortaDron) {
                tipo = String.valueOf(((PortaDron)elemento).getTipo());
            } else if (elemento instanceof Dron) {
                tipo = String.valueOf(((Dron)elemento).getTipo());
            } else {
                tipo = "N/A";
            }
            
            System.out.println("  - Elemento id=" + id + " clase=" + elemento.getClass().getSimpleName() + 
                             " tipo=" + tipo +
                             " pos=(" + elemento.getPosicionX() + "," + elemento.getPosicionY() + "," + elemento.getPosicionZ() + ")" +
                             " estado=" + elemento.getEstado());
            estadoInicial.add(new Evento_Movimiento(elemento, elemento.getPosicionX(), elemento.getPosicionY(), elemento.getAngulo()));
        });
        
        System.out.println("Enviando ACTUALIZAR_PARTIDA con " + estadoInicial.size() + " eventos");
        boolean enviado = fachada.EnviarActualizaciones(jugadores, estadoInicial);
        System.out.println("ACTUALIZAR_PARTIDA enviado=" + enviado);
        
        // GameLoop maneja el ciclo de juego y las actualizaciones por tick, 
        // las acciones de los jugadores se procesan inmediatamente via WebSocket 
        // y se agregan a la cola de eventos del GameLoop
        iniciar(); // Comenzar el ciclo de tick de 30ms
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

    // No sobreescribir processGameLoop - usar la implementación del padre GameLoop 
    // que maneja el ciclo de juego y llama a update/render
    
    @Override
    protected void render() {
        // Llamado en cada tick por GameLoop - enviar actualizaciones a los clientes
        // Solo enviar si hay eventos pendientes (cambios a comunicar)
        if (!accionesPendientesEnviar.isEmpty()) {
            List<Jugador> jugadoresSesion = new java.util.ArrayList<>(elementosJugadores.keySet());
            List<Evento> eventosParaEnviar = new java.util.ArrayList<>(accionesPendientesEnviar);
            
            // Enviar todos los eventos pendientes a los clientes
            fachada.EnviarActualizaciones(jugadoresSesion, eventosParaEnviar);
            
            // Limpiar la cola después de enviar
            accionesPendientesEnviar.clear();
        }
    }
    
    public boolean agregarEvento(Evento ev) {
        // Usa la cola de eventos del padre para integración con GameLoop
        agregarEventoEntrada(ev);
        return true;
    }

    @Override
    protected void processInput(Evento intencion) {
        // Valida eventos y agrega a la cola local de procesamiento
        String tipoEvento = intencion.getClass().getSimpleName();
        
        if (tipoEvento.equals("Evento_Movimiento")) {
            Evento_Movimiento eventoMovimiento = (Evento_Movimiento) intencion;
            Dron dron = (Dron) elementosEnJuego.get(intencion.getIdElemento());
            if (dron.getEstado() != EstadoElemento.ACTIVO || dron.getBateria() <= 0 || dron.getVida() <= 0) {
                return;
            }
            eventoMovimiento.habilitar();
            return;
        }
        
        if (tipoEvento.equals("Evento_Disparo")) {
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
            return;
        }
        
        if (tipoEvento.equals("Evento_Recarga")) {
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
            return;
        }
        
        if (tipoEvento.equals("Evento_DesplegarDron")) {
            Evento_DesplegarDron eventoDesplegarDron = (Evento_DesplegarDron) intencion;
            PortaDron portaDron = (PortaDron) elementosEnJuego.get(intencion.getIdElemento());
            if (portaDron == null || portaDron.getEstado() != EstadoElemento.ACTIVO
                    || portaDron.cantidadDronesDisponibles() <= 0) {
                return;
            }
            eventoDesplegarDron.habilitar();
            return;
        }
        
        System.out.println("Acción desconocida: " + intencion.getClass().getSimpleName());
    }

    private void update(Evento accion) {
        String tipoEvento = accion.getClass().getSimpleName();
        
        if (tipoEvento.equals("Evento_Movimiento")) {
            if (accion.estaHabilitado()) {
                Evento_Movimiento eventoMovimiento = (Evento_Movimiento) accion;
                Dron dron = (Dron) elementosEnJuego.get(accion.getIdElemento());
                dron.moverse(eventoMovimiento);
            }
            this.accionesPendientesEnviar.add(accion);
            return;
        }
        
        if (tipoEvento.equals("Evento_Disparo")) {
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
            return;
        }
        
        if (tipoEvento.equals("Evento_Recarga")) {
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
            return;
        }
        
        if (tipoEvento.equals("Evento_DesplegarDron")) {
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
            return;
        }
        
        if (this.finalizarSesion()) {
                
        }

    }

    public boolean finalizarSesion() {
        // Verificar el estado de cada equipo (portadron + drones)
        int equiposPerdedores = 0;
        Jugador jugadorGanador = null;
        
        for (Map.Entry<Jugador, PortaDron> entrada : elementosJugadores.entrySet()) {
            Jugador jugador = entrada.getKey();
            PortaDron portaDron = entrada.getValue();
            
            boolean equipoPerdio = false;
            
            // Verificar si el portadron está destruido
            if (portaDron.getEstado() == EstadoElemento.DESTRUIDO) {
                // Portadron destruido - verificar si quedan drones activos
                boolean tieneDronesActivos = false;
                
                for (Dron dron : portaDron.getDrones()) {
                    if (dron.getEstado() == EstadoElemento.ACTIVO && dron.getBateria() > 0) {
                        tieneDronesActivos = true;
                    }
                }
                
                // Equipo pierde solo si portadron destruido Y no tiene drones activos
                if (!tieneDronesActivos) {
                    equipoPerdio = true;
                    equiposPerdedores++;
                    System.out.println("Equipo de " + jugador.getNickName() + " ha perdido (portadron destruido, sin drones activos)");
                }
            } else {
                // Portadron vivo - el equipo sigue en juego
                jugadorGanador = jugador;
            }
        }
        
        // Victoria: solo un equipo queda con capacidad de combate
        if (equiposPerdedores >= elementosJugadores.size() - 1) {
            if (jugadorGanador != null) {
                setGanador(jugadorGanador.getId());
                System.out.println("Ganador determinado: " + jugadorGanador.getNickName() + " (ID: " + jugadorGanador.getId() + ")");
                return true;
            }
            
            // Empate si todos perdieron
            if (equiposPerdedores == elementosJugadores.size()) {
                System.out.println("Empate: todos los equipos eliminados");
                return true;
            }
        }
        
        // Juego continua
        return false;
    }

    private void setGanador(String idJugadorGanador) {
        this.ganadorID = idJugadorGanador;
    }

    private String getGanador() {
        return this.ganadorID;
    }

    @Override
    protected void update(long deltaTime) {
        // Lógica de actualización por tick - llamado por GameLoop cada 30ms
        // Maneja sistemas automatizados que necesitan actualizaciones continuas
        // Las acciones del jugador (mover/disparar/desplegar) se manejan inmediatamente via WebSocket
        
        // Procesar eventos pendientes de la cola local (para compatibilidad con WebSocket)
        while (!accionesPendientesProcesar.isEmpty()) {
            Evento accion = accionesPendientesProcesar.remove(0);
            // Procesar el evento usando el manejador existente
            update(accion);
        }
        
        // Actualizar todos los drones - lógica automatizada por tick
        for (Elemento elemento : elementosEnJuego.values()) {
            if (elemento instanceof Dron) {
                Dron dron = (Dron) elemento;
                boolean necesitaActualizacion = false;
                
                // Verificar agotamiento de batería para drones ACTIVO
                if (dron.getEstado() == EstadoElemento.ACTIVO) {
                    // Consumir batería por estar activo (1 por tick)
                    int bateriaAntes = dron.getBateria();
                    dron.consumirBateriaPorMovimiento();
                    
                    if (dron.getBateria() != bateriaAntes) {
                        necesitaActualizacion = true;
                    }
                    
                    if (dron.getBateria() <= 0) {
                        dron.setEstado(EstadoElemento.DESTRUIDO);
                        System.out.println("Dron " + dron.getId() + " destruido por bateria agotada");
                        necesitaActualizacion = true;
                    }
                }
                
                // Manejar estado cargando - recarga de batería y munición por tick
                if (dron.getEstado() == EstadoElemento.CARGANDO) {
                    // Crear o encontrar Evento_Recarga para este dron
                    Evento_Recarga eventoRecarga = null;
                    boolean encontrado = false;
                    for (Evento evento : accionesPendientesEnviar) {
                        if (!encontrado && evento instanceof Evento_Recarga && evento.getIdElemento() == dron.getId()) {
                            eventoRecarga = (Evento_Recarga) evento;
                            encontrado = true;
                        }
                    }
                    
                    // Si no existe evento de recarga, crear uno nuevo
                    if (eventoRecarga == null) {
                        eventoRecarga = new Evento_Recarga(dron);
                        eventoRecarga.habilitar();
                        accionesPendientesEnviar.add(eventoRecarga);
                    }
                    
                    if (eventoRecarga.estaHabilitado()) {
                        // Recarga de batería (1 por tick hasta MAX_BATERIA)
                        if (dron.getBateria() < dron.getMAX_BATERIA()) {
                            dron.recargar(eventoRecarga);
                            necesitaActualizacion = true;
                        }
                        // Recarga de munición (incrementa comenzandoCarga hasta 1000)
                        else if (dron.cantidadMunicionesDisponibles() < dron.getCantidadMunicionInicial()) {
                            dron.recargaMunicion(eventoRecarga);
                            necesitaActualizacion = true;
                        }
                        // Ambas completas - transición a INACTIVO
                        else {
                            eventoRecarga.deshabilitar();
                            accionesPendientesEnviar.remove(eventoRecarga);
                            dron.setEstado(EstadoElemento.INACTIVO);
                            necesitaActualizacion = true;
                        }
                    }
                }
                
                // Enviar actualización de estado del dron si hubo cambios
                if (necesitaActualizacion) {
                    Evento_Movimiento actualizacionDron = new Evento_Movimiento(
                        dron, 
                        dron.getPosicionX(), 
                        dron.getPosicionY(), 
                        dron.getAngulo()
                    );
                    actualizacionDron.habilitar();
                    accionesPendientesEnviar.add(actualizacionDron);
                }
            }
        }
        
        // Manejar destrucción de portadrones - destruir todos sus drones INACTIVO y CARGANDO
        for (Map.Entry<Jugador, PortaDron> entrada : elementosJugadores.entrySet()) {
            PortaDron portaDron = entrada.getValue();
            
            if (portaDron.getEstado() == EstadoElemento.DESTRUIDO) {
                // Destruir todos los drones no activos de este portadron
                for (Dron dron : portaDron.getDrones()) {
                    if (dron.getEstado() == EstadoElemento.INACTIVO || dron.getEstado() == EstadoElemento.CARGANDO) {
                        dron.setEstado(EstadoElemento.DESTRUIDO);
                        System.out.println("Dron " + dron.getId() + " destruido junto con su portadron");
                        
                        // Enviar actualización
                        Evento_Movimiento actualizacionDron = new Evento_Movimiento(
                            dron, 
                            dron.getPosicionX(), 
                            dron.getPosicionY(), 
                            dron.getAngulo()
                        );
                        actualizacionDron.habilitar();
                        accionesPendientesEnviar.add(actualizacionDron);
                    }
                }
            }
        }
        
        // Verificar condiciones de victoria cada tick
        if (finalizarSesion()) {
            String ganador = getGanador();
            if (ganador != null) {
                System.out.println("Sesion finalizada - Ganador: " + ganador);
                fachada.EnviarFinPartida(ganador);
            } else {
                System.out.println("Sesion finalizada - Empate");
                fachada.EnviarFinPartida("EMPATE");
            }
            stopGameLoop();
        }
    }

}