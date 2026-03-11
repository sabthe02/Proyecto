package com.Proyecto.SpringBoot.Logica;

public class Evento_RecibeImpacto extends Evento {

    Elemento ElementoEmisor;

    public Evento_RecibeImpacto() {
        ElementoEmisor = null;
    }

    public Evento_RecibeImpacto(Elemento idElemento, Elemento idElementoEmisor) {
        super(idElemento);
        this.ElementoEmisor = idElementoEmisor;
    }

    public Elemento getIdElementoEmisor() {
        return ElementoEmisor;
    }

    public void setIdElementoEmisor(Elemento idElementoEmisor) {
        this.ElementoEmisor = idElementoEmisor;
    }

}
