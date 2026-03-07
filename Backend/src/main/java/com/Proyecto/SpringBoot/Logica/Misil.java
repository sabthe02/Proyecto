package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Misil extends Municion {

    int velocidad;
    float distancia;

    public Misil(int id, Jugador jugador) {
        super(id, jugador);
        velocidad = 1;
        distancia = 60F;
    }

    public Misil(int id, 
                Float posicionX, 
                Float posicionY, 
                float posicionZ, 
                Integer angulo, 
                Integer vida,
                EstadoElemento estado, 
                int velocidad, 
                float distancia, 
                Jugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
        this.velocidad = 1;
        this.distancia = 60F;
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

    public void moverse(Evento_Movimiento intencion) {
        if (intencion == null) {
            return;
        }
        double rad = Math.toRadians(this.angulo);
        float avance = this.velocidad;

        intencion.setNuevaPosX(this.getPosicionX() + (float) (avance * Math.cos(rad)));
        intencion.setNuevaPosY(this.getPosicionY() + (float) (avance * Math.sin(rad)));
        
        if (this.distancia<=0) {
            this.setEstado(EstadoElemento.INACTIVO);
        } 

    }

    @Override
    public void recibeImpacto(Evento_Movimiento intencion) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'recibeImpacto'");
    }
    

}
