package com.Proyecto.SpringBoot.Logica;

import java.util.Random;
import java.util.concurrent.ConcurrentLinkedQueue;

public abstract class GameLoop {

    private final int TICK = 30; // milisegundos
    private volatile boolean corriendo = false;
    EstadoJuego estadoJuego;
    private Thread gameThread;
    private final ConcurrentLinkedQueue<Evento> accionesPendientesProcesar;


    public GameLoop() {
        estadoJuego = EstadoJuego.INICIANDO;
        accionesPendientesProcesar = new ConcurrentLinkedQueue<>();
    }

    protected void iniciar() {
        if (!corriendo) {
            estadoJuego = EstadoJuego.INICIANDO;
            corriendo = true;
            gameThread = new Thread(this::processGameLoop);
            gameThread.start();
        }
    }

    protected void agregarEventoPendiente(Evento ev)
    {
        accionesPendientesProcesar.add(ev);
    }

    public void stopGameLoop() {
        corriendo = false;
        estadoJuego = EstadoJuego.FINALIZADO;
    }

    public boolean isGameRunning() {
        return estadoJuego == EstadoJuego.EN_JUEGO;
    }

    public void agregarEventoEntrada(Evento evento) {
        accionesPendientesProcesar.add(evento);
    }

    protected abstract void update(Evento accion);

    protected abstract void processInput(Evento accion);

    protected abstract void render();

    protected void processGameLoop() {

        estadoJuego = EstadoJuego.EN_JUEGO;
        long ultimoTick = System.currentTimeMillis();

        while (corriendo) {
            long ahora = System.currentTimeMillis();
            long tiempoTranscurrido = ahora - ultimoTick;
            if (tiempoTranscurrido >= TICK) {

                // pROCESAMOS TODOS LOS EVENTOS DE ENTRADA QUE HAYAN LLEGADO
                Evento evento;
                while ((evento = accionesPendientesProcesar.poll()) != null) {
                    processInput(evento);
                    update(evento);
                }

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
