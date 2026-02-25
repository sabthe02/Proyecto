package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public abstract class Municion extends Elemento {

    boolean usada;


    public Municion(int idElemento, Jugador jugador) {
        super(idElemento, jugador);
        this.usada = false;
    }

    public Municion(int id, Float posicionX, Float posicionY, float posicionZ, Integer angulo, Integer vida,
            EstadoElemento estado, Jugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
        this.usada = false;
    }

    public boolean isUsada() {
        return usada;
    }

    public void setUsada(boolean usada) {
        this.usada = usada;
    }



}
