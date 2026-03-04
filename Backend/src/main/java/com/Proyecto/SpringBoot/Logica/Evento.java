package com.Proyecto.SpringBoot.Logica;

public abstract class Evento {
    Elemento elemento;
    private boolean habilitado = false;


    public Evento() {
        elemento = null;
    }

    public Evento(Elemento elemento) {
        this.elemento = elemento;
    }

    public boolean estaHabilitado() {
        return habilitado;
    }
    public void habilitar() {
        this.habilitado = true;
    }

    public void deshabilitar() {
        this.habilitado = false;
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
