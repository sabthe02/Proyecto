package com.Proyecto.SpringBoot.Logica;

public class Evento_Movimiento extends Evento {

    float nuevaPosX;
    float nuevaPosY;

    public Evento_Movimiento() {
        super();
        nuevaPosX = 0;
        nuevaPosY = 0;
    }


    public Evento_Movimiento(int idElemento, float nuevaPosX, float nuevaPosY) {
        super(idElemento);
        this.nuevaPosX = nuevaPosX;
        this.nuevaPosY = nuevaPosY;
    }

    public int getIdElemento() {
        return idElemento;
    }

    public void setIdElemento(int idElemento) {
        this.idElemento = idElemento;
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

}
