package com.Proyecto.SpringBoot.Logica;

public abstract class Evento {
    int idElemento;

    public Evento() {
        idElemento = 0;
    }

    public Evento(int idElemento) {
        this.idElemento = idElemento;
    }

    public int getIdElemento() {
        return idElemento;
    }

    public void setIdElemento(int idElemento) {
        this.idElemento = idElemento;
    }


}
