package com.Proyecto.SpringBoot.Logica;

public class Mapa {
    private int[][] contenido;

    public Mapa() {
        contenido = new int[600][600];

        for (int i = 0; i < 600; i++) {
            for (int j = 0; j < 600; j++) {
                contenido[i][j] = 0;
            }
        }
    }

    public Mapa(int[][] contenido) {
        this.contenido = contenido;
    }

    public int[][] getContenido() {
        return contenido;
    }

    public void setContenido(int[][] contenido) {
        this.contenido = contenido;
    }

    public int getContenido(int i, int j) {
        return contenido[i][j];
    }

    public void setContenido(int i, int j, int valor) {
        contenido[i][j] = valor;
    }

    // Se define un ovalo de alcance al misil
    public boolean estaEnLaTrayectoriaMisil(float nuevaPosX, float nuevaPosY,
            float posicionX, float posicionY,
            float radio, int angulo) {

        float radioLargo = radio;
        float radioCorto = radio / 2.0f;

        float relX = posicionX - nuevaPosX;
        float relY = posicionY - nuevaPosY;

        double angleRad = Math.toRadians(angulo);
        float cosA = (float) Math.cos(-angleRad);
        float sinA = (float) Math.sin(-angleRad);

        float localX = relX * cosA - relY * sinA;
        float localY = relX * sinA + relY * cosA;

        float resultadoElipse = (localX * localX) / (radioLargo * radioLargo) +
                (localY * localY) / (radioCorto * radioCorto);

        return (resultadoElipse <= 1.0f);
    }

    public boolean estaEnLaTrayectoriaBomba(float nuevaPosX, float nuevaPosY, float nuevaPosZ,
            float posicionX, float posicionY, float posicionZ,
            float radio) {

        boolean resp = false;
        // 1. Condición de altura: nuevaPosZ debe ser menor a posicionZ
        if (nuevaPosZ > posicionZ) {
            return false;
        }

        if (nuevaPosX - radio < posicionX && nuevaPosX + radio > posicionX) {
            if (nuevaPosY - radio < posicionY && nuevaPosY + radio > posicionY) {
                resp = true;
            }

        }

        return resp;
    }
}
