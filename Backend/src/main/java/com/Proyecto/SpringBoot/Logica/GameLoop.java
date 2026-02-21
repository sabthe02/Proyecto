package com.Proyecto.SpringBoot.Logica;

import java.util.Random;

public abstract class GameLoop {

    EstadoJuego estadoJuego;
    private Thread gameThread;

    public GameLoop() {
        estadoJuego = EstadoJuego.INICIANDO;
    }

    public void run() {
        estadoJuego = EstadoJuego.EN_JUEGO;
        gameThread = new Thread(this::processGameLoop);
        gameThread.start();
    }

    public void stop() {
        estadoJuego = EstadoJuego.FINALIZADO;
    }

    public boolean isGameRunning() {
        return estadoJuego == EstadoJuego.EN_JUEGO;
    }

    protected abstract void processInput(Evento accion);

    protected void render() {
        // var position = controller.getBulletPosition();
        // logger.info("Current bullet position: " + position);
    }

    protected abstract void processGameLoop();
}
