package com.Proyecto.SpringBoot.Datos.Entidades;

import com.Proyecto.SpringBoot.Logica.EstadoElemento;

import jakarta.persistence.Entity;

@Entity
public class EntidadMisil extends EntidadMunicion {

    private int velocidad;
    private float distancia;

    public EntidadMisil(int id,
            Float posicionX,
            Float posicionY,
            float posicionZ,
            Integer angulo,
            Integer vida,
            EstadoElemento estado,
            EntidadJugador jugador,
            boolean usada,
            int velocidad,
            float distancia) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador, usada);

        this.velocidad = velocidad;
        this.distancia = distancia;
    }

    public EntidadMisil(){
        super();
        this.velocidad = 0;
        this.distancia = 0f;
    }
    public int getVelocidad() {
        return velocidad;
    }

    public void setVelocidad(int velocidad) {
        this.velocidad = velocidad;
    }

    public float getDistancia() {
        return distancia;
    }

    public void setDistancia(float distancia) {
        this.distancia = distancia;
    }
}
