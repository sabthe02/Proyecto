package com.Proyecto.SpringBoot.Logica;

import java.security.Timestamp;
import java.util.Random;
import java.util.concurrent.ConcurrentLinkedQueue;

public abstract class GameLoop {

    private final int TICK = 30; // milisegundos
    private volatile boolean corriendo = false;
    EstadoJuego estadoJuego;
    private Thread gameThread;

    public GameLoop() {
        estadoJuego = EstadoJuego.INICIANDO;
    }

    protected void iniciar() {
        if (!corriendo) {
            estadoJuego = EstadoJuego.INICIANDO;
            corriendo = true;
            gameThread = new Thread(this::processGameLoop);
            gameThread.start();
        }
    }

    

    public void stopGameLoop() {
        corriendo = false;
        estadoJuego = EstadoJuego.FINALIZADO;
    }

    public boolean isGameRunning() {
        return estadoJuego == EstadoJuego.EN_JUEGO;
    }

    

    protected abstract void update(long deltaTime);

    protected abstract void processInput(Evento accion);

    protected abstract void render();

    protected void processGameLoop() {

        estadoJuego = EstadoJuego.EN_JUEGO;
        long ultimoTick = System.currentTimeMillis();

        while (corriendo) {
            long ahora = System.currentTimeMillis();
            long tiempoTranscurrido = ahora - ultimoTick;
            if (tiempoTranscurrido >= TICK) {

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
    }
}
