package com.Proyecto.SpringBoot.Logica;

import java.util.List;
import java.util.Map;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.Excepciones.PartidaException;

public class SesionJuego extends GameLoop {
    // Variables para finalizarSesion
    private int equiposPerdedores;
    private EntidadJugador jugadorGanador;

    private String idSesion;
    private Map<EntidadJugador, PortaDron> elementosJugadores;
    private Map<Integer, Elemento> elementosEnJuego;
    private List<Evento> accionesPendientesEnviar;
    private List<Evento> accionesPendientesProcesar;
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
        accionesPendientesProcesar = new java.util.ArrayList<Evento>();
    }

    public void setNotificadorPartida(iPartidaService notificadorPartida) {
        this.notificadorPartida = notificadorPartida;
    }

    private PortaDron crearPortaDronParaJugador(EntidadJugador jugador) {
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
        for (int h = 0; h < elementosJugadores.size(); h++) {
            EntidadJugador jugador = (EntidadJugador) elementosJugadores.keySet().toArray()[h];
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

        // Enviar estado inicial del juego (elementos creados).
        // El frontend crea todas las entidades a partir de este mensaje.
        // ACTUALIZAR_PARTIDA se envía solo cuando el loop procesa eventos del frontend (MOVER, DISPARAR, etc.)
        notificadorPartida.EnviarInicioPartida(portaDrones, mapa);

        iniciar(); // Comenzar el ciclo de tick de 30ms

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

    public List<Evento> getAccionesPendientesProcesar() {
        return accionesPendientesProcesar;
    }

    public Elemento getElemento(int idElemento) throws PartidaException
    {
        Elemento el = elementosEnJuego.get(idElemento);

        if(el == null)
        {
            throw new PartidaException("El elemento " + idElemento + " no existe en la partida.");
        }

        return el;
    }

    @Override
    protected void render() {
        // Llamado en cada tick por GameLoop - enviar actualizaciones a los clientes
        // Solo enviar si hay eventos pendientes (cambios a comunicar)
        if (!accionesPendientesEnviar.isEmpty()) {
            List<EntidadJugador> jugadoresSesion = new java.util.ArrayList<>(elementosJugadores.keySet());
            List<Evento> eventosParaEnviar = new java.util.ArrayList<>(accionesPendientesEnviar);
            // Enviar todos los eventos pendientes a los clientes
            notificadorPartida.EnviarActualizaciones(jugadoresSesion, eventosParaEnviar);
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
            Elemento el = elementosEnJuego.get(intencion.getIdElemento());
            if (el instanceof Dron) {
                Dron dron = (Dron) el;
                if (dron.getEstado() != EstadoElemento.ACTIVO || dron.getBateria() <= 0 || dron.getVida() <= 0) {
                    return;
                }
                eventoMovimiento.habilitar();
                accionesPendientesProcesar.add(eventoMovimiento);
                return;
            }
            if (el instanceof PortaDron) {
                PortaDron portaDron = (PortaDron) el;
                if (portaDron.getEstado() != EstadoElemento.ACTIVO || portaDron.getVida() <= 0) {
                    return;
                }
                eventoMovimiento.habilitar();
                accionesPendientesProcesar.add(eventoMovimiento);
                return;
            }
            return;
        }
        
        if (tipoEvento.equals("Evento_Disparo")) {
            Evento_Disparo eventoDisparo = (Evento_Disparo) intencion;
            Elemento el = elementosEnJuego.get(intencion.getIdElemento());
            if (el instanceof Dron) {
                Dron dronDisparador = (Dron) el;
                if (dronDisparador.getEstado() != EstadoElemento.ACTIVO ||
                        dronDisparador.getBateria() <= 0 ||
                        dronDisparador.getVida() <= 0 ||
                        dronDisparador.cantidadMunicionesDisponibles() <= 0) {
                    return;
                }
                eventoDisparo.habilitar();
                accionesPendientesProcesar.add(eventoDisparo);
                return;
            }
            // Si no es Dron, ignorar
            return;
        }
        
        if (tipoEvento.equals("Evento_Recarga")) {
            Evento_Recarga eventoRecarga = (Evento_Recarga) intencion;
            Elemento el = elementosEnJuego.get(intencion.getIdElemento());
            if (el instanceof Dron) {
                Dron dronRecarga = (Dron) el;
                if (dronRecarga.getEstado() != EstadoElemento.ACTIVO || dronRecarga.getBateria() <= 0
                        || dronRecarga.getVida() <= 0) {
                    return;
                }
                eventoRecarga.habilitar();
                accionesPendientesProcesar.add(eventoRecarga);
                return;
            }
            // Si no es Dron, ignorar
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
            accionesPendientesProcesar.add(eventoDesplegarDron);
            return;
        }
        
        System.out.println("Acción desconocida: " + intencion.getClass().getSimpleName());
    }

    private void update(Evento accion) {
        String tipoEvento = accion.getClass().getSimpleName();
        
        if (tipoEvento.equals("Evento_Movimiento")) {
            if (accion.estaHabilitado()) {
                Evento_Movimiento eventoMovimiento = (Evento_Movimiento) accion;
                Elemento el = elementosEnJuego.get(accion.getIdElemento());
                el.moverse(eventoMovimiento);
            }
            this.accionesPendientesEnviar.add(accion);
            return;
        }
        
        if (tipoEvento.equals("Evento_Disparo")) {
            if (accion.estaHabilitado()) {
                Dron dronDisparador = (Dron) elementosEnJuego.get(accion.getIdElemento());
                Elemento municion = dronDisparador.disparar((Evento_Disparo) accion);
                if (municion != null) {
                    municion.setPosicionX(dronDisparador.getPosicionX());
                    municion.setPosicionY(dronDisparador.getPosicionY());
                    float[] trayectoria = calcularTrayectoriaHaciaEnemigo(dronDisparador);
                    municion.setAngulo((int) trayectoria[0]);
                    // Usar el rango fijo del proyectil (DIS_MAX) - no ampliar por distancia al objetivo
                    // El proyectil alcanza solo lo que está dentro de su rango (1500 unidades)
                    municion.setEstado(EstadoElemento.ACTIVO);
                    elementosEnJuego.put(municion.getId(), municion);
                    Evento_Movimiento evMun = new Evento_Movimiento(municion,
                        municion.getPosicionX(), municion.getPosicionY(), municion.getAngulo());
                    evMun.habilitar();
                    accionesPendientesEnviar.add(evMun);
                }
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
        equiposPerdedores = 0;
        jugadorGanador = null;
        for (PortaDron pd : elementosJugadores.values()) {
            if (pd.getEstado() == EstadoElemento.DESTRUIDO
                    && pd.cantidadDronesDestruidos() <= pd.drones.size()) {
                equiposPerdedores++;
            }
        }
        EntidadJugador posibleGanador = null;
        for (Map.Entry<EntidadJugador, PortaDron> entry : elementosJugadores.entrySet()) {
            EntidadJugador jugador = entry.getKey();
            PortaDron pd = entry.getValue();
            if (pd.getEstado() != EstadoElemento.DESTRUIDO) {
                posibleGanador = jugador;
            }
        }
        jugadorGanador = posibleGanador;

        // Victoria: solo un equipo queda con capacidad de combate
        if (equiposPerdedores >= elementosJugadores.size() - 1) {
            if (jugadorGanador != null) {
                ganadorID = jugadorGanador.getId();
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
    // Implementación faltante para PartidasService
    public boolean accion_recargar(EntidadJugador jugador, int idDron) {
        Elemento elemento = elementosEnJuego.get(idDron);
        if (elemento instanceof Dron) {
            Dron dron = (Dron) elemento;
            if (dron.getEstado() == EstadoElemento.ACTIVO) {
                // Setear CARGANDO - el bucle de actualización (update) manejará la recarga tick a tick
                dron.setEstado(EstadoElemento.CARGANDO);
                return true;
            }
        }
        return false;
    }

    private String getGanador() {
        return this.ganadorID;
    }

    // Calcula ángulo y distancia hacia el enemigo más cercano
    private float[] calcularTrayectoriaHaciaEnemigo(Dron origen) {
        TipoElemento tipoOrigen = origen.getTipo();
        Elemento objetivo = null;
        float menorDistancia = Float.MAX_VALUE;
        for (Elemento el : elementosEnJuego.values()) {
            TipoElemento tipoEl = null;
            if (el instanceof Dron) tipoEl = ((Dron) el).getTipo();
            else if (el instanceof PortaDron) tipoEl = ((PortaDron) el).getTipo();
            if (tipoEl == null || tipoEl == tipoOrigen) continue;
            // Solo considerar elementos ACTIVO como objetivos
            if (el.getEstado() != EstadoElemento.ACTIVO) continue;
            float dx = el.getPosicionX() - origen.getPosicionX();
            float dy = el.getPosicionY() - origen.getPosicionY();
            float dist = (float) Math.sqrt(dx * dx + dy * dy);
            if (dist < menorDistancia) {
                menorDistancia = dist;
                objetivo = el;
            }
        }
        if (objetivo == null) return new float[]{0f, 5000f};
        float dx = objetivo.getPosicionX() - origen.getPosicionX();
        float dy = objetivo.getPosicionY() - origen.getPosicionY();
        float angulo = (float) Math.toDegrees(Math.atan2(dy, dx));
        // El proyectil viaja la distancia exacta al objetivo + margen de 500 unidades
        return new float[]{angulo, menorDistancia + 500f};
    }

    private int calcularAnguloHaciaEnemigo(Dron origen) {
        return (int) calcularTrayectoriaHaciaEnemigo(origen)[0];
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
        for (Map.Entry<EntidadJugador, PortaDron> entrada : elementosJugadores.entrySet()) {
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
        
        // Mover municiones y verificar colisiones en cada tick
        List<Elemento> elementosSnapshot = new java.util.ArrayList<>(elementosEnJuego.values());
        for (Elemento el : elementosSnapshot) {
            if (!(el instanceof Municion)) continue;
            if (el.getEstado() != EstadoElemento.ACTIVO) continue;
            Municion municion = (Municion) el;
            boolean alcanzado = false;
            if (municion instanceof Misil) {
                ((Misil) municion).calculoDeNuevaPosicion();
                if (((Misil) municion).getDistancia() <= 0) {
                    municion.setEstado(EstadoElemento.DESTRUIDO);
                    // Notificar al frontend que el misil fue destruido (falló)
                    Evento_Movimiento evDestruido = new Evento_Movimiento(municion,
                        municion.getPosicionX(), municion.getPosicionY(), municion.getAngulo());
                    evDestruido.habilitar();
                    accionesPendientesEnviar.add(evDestruido);
                    alcanzado = true;
                }
            } else if (municion instanceof Bomba) {
                float speed = 30f;
                ((Bomba) municion).calculoDeNuevaPosicion(speed);
                if (((Bomba) municion).getDistancia() <= 0) {
                    municion.setEstado(EstadoElemento.DESTRUIDO);
                    // Notificar al frontend que la bomba fue destruida (falló)
                    Evento_Movimiento evDestruido = new Evento_Movimiento(municion,
                        municion.getPosicionX(), municion.getPosicionY(), municion.getAngulo());
                    evDestruido.habilitar();
                    accionesPendientesEnviar.add(evDestruido);
                    alcanzado = true;
                }
            }
            if (!alcanzado) {
                boolean impacto = false;
                String teamMunicion = "";
                if (municion.getJugador() != null && municion.getJugador().getTeam() != null) {
                    teamMunicion = municion.getJugador().getTeam().toUpperCase();
                }
                for (Elemento objetivo : elementosSnapshot) {
                    if (!impacto) {
                        if (objetivo != municion
                            && (objetivo instanceof Dron || objetivo instanceof PortaDron)
                            && objetivo.getEstado() == EstadoElemento.ACTIVO) {
                            TipoElemento tipoObjetivo = null;
                            if (objetivo instanceof Dron) {
                                tipoObjetivo = ((Dron) objetivo).getTipo();
                            } else if (objetivo instanceof PortaDron) {
                                tipoObjetivo = ((PortaDron) objetivo).getTipo();
                            }
                            if (tipoObjetivo != null && !tipoObjetivo.toString().equalsIgnoreCase(teamMunicion)) {
                                float dx = objetivo.getPosicionX() - municion.getPosicionX();
                                float dy = objetivo.getPosicionY() - municion.getPosicionY();
                                float dist = (float) Math.sqrt(dx * dx + dy * dy);
                                if (dist < 150f) {
                                    int dano;
                                    String claseProyectil;
                                    if (municion instanceof Misil) {
                                        dano = 50;
                                        claseProyectil = "MISIL";
                                    } else {
                                        dano = 100;
                                        claseProyectil = "BOMBA";
                                    }
                                    objetivo.setVida(Math.max(0, objetivo.getVida() - dano));
                                    boolean destruido = objetivo.getVida() <= 0;
                                    if (destruido) {
                                        objetivo.setEstado(EstadoElemento.DESTRUIDO);
                                    }
                                    Evento_AplicarDano eventoDano = new Evento_AplicarDano(
                                        objetivo, dano, objetivo.getVida(), destruido, claseProyectil);
                                    eventoDano.habilitar();
                                    accionesPendientesEnviar.add(eventoDano);
                                    municion.setEstado(EstadoElemento.DESTRUIDO);
                                    // Notificar al frontend que el proyectil fue destruido (impactó)
                                    Evento_Movimiento evImpacto = new Evento_Movimiento(municion,
                                        municion.getPosicionX(), municion.getPosicionY(), municion.getAngulo());
                                    evImpacto.habilitar();
                                    accionesPendientesEnviar.add(evImpacto);
                                    impacto = true;
                                }
                            }
                        }
                    }
                }
                if (municion.getEstado() == EstadoElemento.ACTIVO) {
                    Evento_Movimiento evMun = new Evento_Movimiento(municion,
                        municion.getPosicionX(), municion.getPosicionY(), municion.getAngulo());
                    evMun.habilitar();
                    accionesPendientesEnviar.add(evMun);
                }
            }
        }

        // Verificar condiciones de victoria cada tick
        if (finalizarSesion()) {
            String ganador = getGanador();
            if (ganador != null) {
                System.out.println("Sesion finalizada - Ganador: " + ganador);
                notificadorPartida.EnviarFinPartida(ganador);
            } else {
                System.out.println("Sesion finalizada - Empate");
                notificadorPartida.EnviarFinPartida("EMPATE");
            }
            stopGameLoop();
        }
    }

}