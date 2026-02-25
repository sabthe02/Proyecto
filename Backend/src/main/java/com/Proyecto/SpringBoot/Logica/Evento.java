package com.Proyecto.SpringBoot.Logica;

public abstract class Evento {
    Elemento elemento;

    public Evento() {
        elemento = null;
    }

    public Evento(Elemento elemento) {
        this.elemento = elemento;
    }

    public int getIdElemento() {
        return elemento.getId();
    }

    public Elemento getElemento() {
        return elemento;
    }

    public void setElemento(Elemento elemento) {
        this.elemento = elemento;
    }
    

}
