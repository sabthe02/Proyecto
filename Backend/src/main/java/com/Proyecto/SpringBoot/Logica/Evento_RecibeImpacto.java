package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Evento_RecibeImpacto extends Evento {

    Elemento ElementoEmisor;

    public Evento_RecibeImpacto() {
        ElementoEmisor = new Dron(0, 1f, 1f, 0, 0, 0, EstadoElemento.DESTRUIDO, TipoElemento.NAVAL, new EntidadJugador());
    }

    public Evento_RecibeImpacto(Elemento idElemento, Elemento idElementoEmisor) {
        super(idElemento);
        this.ElementoEmisor = idElementoEmisor;
    }

    public Elemento getElementoEmisor() {
        return ElementoEmisor;
    }

    public void setElementoEmisor(Elemento idElementoEmisor) {
        this.ElementoEmisor = idElementoEmisor;
    }

}
