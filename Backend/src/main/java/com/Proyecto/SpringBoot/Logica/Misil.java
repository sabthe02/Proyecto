package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Misil extends Municion {

    int velocidad;
    float distancia;

    public Misil(int id, Jugador jugador) {
        super(id, jugador);
        velocidad = 1;
        distancia = 1;
    }

    public Misil(int id, Float posicionX, Float posicionY, float posicionZ, Integer angulo, Integer vida,
            EstadoElemento estado, int velocidad, float distancia, Jugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
        this.velocidad = velocidad;
        this.distancia = distancia;
    }

    public int getVelocidad() {
        return velocidad;
    }

    public float getDistancia() {
        return distancia;
    }

    public void setVelocidad(int velocidad) {
        this.velocidad = velocidad;
    }

    public void setDistancia(float distancia) {
        this.distancia = distancia;
    }
    

}
