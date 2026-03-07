package com.Proyecto.SpringBoot.Logica;

public class Evento_Recarga extends Evento {
    private boolean cargaIniciada = false;
    private Dron dronAsociado = null;

    public Evento_Recarga() {
        super();
    }

    public Evento_Recarga(Elemento elemento) {
        super(elemento);
    }

    public void comenzarCarga(Dron dron) {
        this.cargaIniciada = true;
        this.dronAsociado = dron;
        if (dron != null) {
            dron.setEstado(EstadoElemento.CARGANDO);
        }
    }

    public void finalizarCarga() {
        this.cargaIniciada = false;
        if (this.dronAsociado != null) {
            this.dronAsociado.setEstado(EstadoElemento.INACTIVO);
        }
    }

    public boolean isCargaIniciada() {
        return cargaIniciada;
    }

    public Dron getDronAsociado() {
        return dronAsociado;
    }
}
