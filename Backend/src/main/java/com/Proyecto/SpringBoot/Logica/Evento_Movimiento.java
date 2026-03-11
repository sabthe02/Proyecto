package com.Proyecto.SpringBoot.Logica;


public class Evento_Movimiento extends Evento {

    float nuevaPosX;
    float nuevaPosY;
    int nuevoAngulo;
    Integer bateria; // Campo opcional para drones - null para otros elementos

    public Evento_Movimiento() {
        super();
        nuevaPosX = 0;
        nuevaPosY = 0;
        nuevoAngulo = 0;
        bateria = null;
    }

    public Evento_Movimiento(Elemento idElemento, float nuevaPosX, float nuevaPosY, int angulo) {
        super(idElemento);
        this.nuevaPosX = nuevaPosX;
        this.nuevaPosY = nuevaPosY;
        this.nuevoAngulo = angulo;
        // Si el elemento es un dron, incluir su batería
        if (idElemento instanceof Dron) {
            this.bateria = ((Dron) idElemento).getBateria();
        } else {
            this.bateria = null;
        }
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

    public float getNuevaPosZ() {
        return Elemento.MAX_ALTURA;
    }

    
    public void setNuevaPosY(float nuevaPosY) {
        this.nuevaPosY = nuevaPosY;
    }

    public int getNuevoAngulo() {
        return nuevoAngulo;
    }

    public void setNuevoAngulo(int nuevoAngulo) {
        this.nuevoAngulo = nuevoAngulo;
    }

    public Integer getBateria() {
        return bateria;
    }

    public void setBateria(Integer bateria) {
        this.bateria = bateria;
    }

}
