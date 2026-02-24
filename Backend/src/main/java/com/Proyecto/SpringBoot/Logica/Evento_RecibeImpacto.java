package com.Proyecto.SpringBoot.Logica;

public class Evento_RecibeImpacto extends Evento {

    int idElementoEmisor;

    public Evento_RecibeImpacto() {
        idElementoEmisor = 0;
    }

    public Evento_RecibeImpacto(Elemento idElemento, int idElementoEmisor) {
        super(idElemento);
        this.idElementoEmisor = idElementoEmisor;
    }

    public int getIdElementoEmisor() {
        return idElementoEmisor;
    }

    public void setIdElementoEmisor(int idElementoEmisor) {
        this.idElementoEmisor = idElementoEmisor;
    }

}
