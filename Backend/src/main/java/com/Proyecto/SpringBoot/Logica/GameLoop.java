package com.Proyecto.SpringBoot.Logica;

import java.util.Random;
import java.util.concurrent.ConcurrentLinkedQueue;

public abstract class GameLoop {

    private final int TICK = 30; // milisegundos
    private volatile boolean corriendo = false;
    EstadoJuego estadoJuego;
    private Thread gameThread;
    private final ConcurrentLinkedQueue<Evento> colaEventosEntrada;

    public GameLoop() {
        estadoJuego = EstadoJuego.INICIANDO;
        colaEventosEntrada = new ConcurrentLinkedQueue<>();
    }

    public void iniciar() {
        if (!corriendo) {
            estadoJuego = EstadoJuego.INICIANDO;
            corriendo = true;
            gameThread = new Thread(this::processGameLoop);
            gameThread.start();
            // run();
        }
    }

    /*
     * public void run() {
     * estadoJuego = EstadoJuego.EN_JUEGO;
     * gameThread = new Thread(this::processGameLoop);
     * gameThread.start();
     * }
     */

    public void stop() {
        corriendo = false;
        estadoJuego = EstadoJuego.FINALIZADO;
    }

    public boolean isGameRunning() {
        return estadoJuego == EstadoJuego.EN_JUEGO;
    }

    public void agregarEventoEntrada(Evento evento) {
        colaEventosEntrada.add(evento);
    }

    protected abstract void update(long tiempoTranscurrido);

    protected abstract void processInput(Evento accion);

    protected void render() {
        // var position = controller.getBulletPosition();
        // logger.info("Current bullet position: " + position);
    }

    protected void processGameLoop() {

        estadoJuego = EstadoJuego.EN_JUEGO;
        long ultimoTick = System.currentTimeMillis();

        while (corriendo) {
            long ahora = System.currentTimeMillis();
            long tiempoTranscurrido = ahora - ultimoTick;
            if (tiempoTranscurrido >= TICK) {

                // pROCESAMOS TODOS LOS EVENTOS DE ENTRADA QUE HAYAN LLEGADO
                Evento evento;
                while ((evento = colaEventosEntrada.poll()) != null) {
                    processInput(evento);
                }

                // ACTUALIZAMOS EL ESTADO DEL JUEGO
                update(tiempoTranscurrido);

                // RENDERIZAMOS EL JUEGO
                render();

                // ACTUALIZAMOS EL TIEMPO DEL uLTIMO TICK
                ultimoTick = ahora;
            }
            try {
                long dormir = TICK - (System.currentTimeMillis() - ultimoTick);
                if (dormir > 0)
                    Thread.sleep(dormir);
                else
                    Thread.sleep(1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

        }
    };
}
