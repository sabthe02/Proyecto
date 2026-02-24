package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Bomba extends Municion {

    int peso;
    float radioExplosion;

    public Bomba(int id, Jugador jugador) {
        super(id, jugador);
        this.peso = 100;
        this.radioExplosion = 5f;
    }

    public Bomba(int id, Float posicionX, Float posicionY, float posicionZ, Integer angulo, Integer vida,
            EstadoElemento estado, int peso, float radioExplosion, Jugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
        this.peso = peso;
        this.radioExplosion = radioExplosion;
    }

    public int getPeso() {
        return peso;
    }

    public float getRadioExplosion() {
        return radioExplosion;
    }

    public void setPeso(int peso) {
        this.peso = peso;
    }

    public void setRadioExplosion(float radioExplosion) {
        this.radioExplosion = radioExplosion;
    }


}
