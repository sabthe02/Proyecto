package com.Proyecto.SpringBoot.Logica;

public class Evento_Movimiento extends Evento {

    float nuevaPosX;
    float nuevaPosY;
    int angulo;

    public Evento_Movimiento() {
        super();
        nuevaPosX = 0;
        nuevaPosY = 0;
        angulo = 0;
    }

    public Evento_Movimiento(Elemento idElemento, float nuevaPosX, float nuevaPosY, int angulo) {
        super(idElemento);
        this.nuevaPosX = nuevaPosX;
        this.nuevaPosY = nuevaPosY;
        this.angulo = angulo;
    }

    public float getNuevaPosX() {
        return nuevaPosX;
    }

    public void setNuevaPosX(float nuevaPosX) {
        this.nuevaPosX = nuevaPosX;
    }

    public float getNuevaPosY() {
        return nuevaPosY;
    }

    public void setNuevaPosY(float nuevaPosY) {
        this.nuevaPosY = nuevaPosY;
    }

    public int getAngulo() {
        return angulo;
    }

    public void setAngulo(int angulo) {
        this.angulo = angulo;
    }
}
