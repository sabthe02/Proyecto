package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Misil extends Municion {

    int velocidad;
    float distancia;
    private float DIS_MAX = 1500f;

    public Misil(int id, EntidadJugador jugador) {
        super(id, jugador);
        velocidad = 50;
        distancia = DIS_MAX;
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
                EntidadJugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
        this.velocidad = 50;
        this.distancia = DIS_MAX;
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

        Misil misil = (Misil) intencion.getElemento();
        this.posicionX = misil.posicionX;
        this.posicionY = misil.posicionY;
        this.posicionZ = misil.posicionZ;
        this.distancia = this.distancia - velocidad;
        if (this.distancia <= 0) {
            this.setEstado(EstadoElemento.INACTIVO);
        }

    }

    @Override
    public void recibeImpacto(Evento_Movimiento intencion) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'recibeImpacto'");
    }

    @Override
    protected TipoElemento getTipo() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getTipo'");
    }

    @Override
    protected int getBateria() {
        return 0;
    }

    public float getDIS_MAX() {
        return DIS_MAX;
    }

    public void mover(Evento_Movimiento eventoMovimientoMisil) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'mover'");
    }

    public void calculoDeNuevaPosicion() {
        double angleRad = Math.toRadians(this.angulo);
        float deltaX = (float) (Math.cos(angleRad) * this.velocidad);
        float deltaY = (float) (Math.sin(angleRad) * this.velocidad);
        this.posicionX += deltaX;
        this.posicionY += deltaY;
        this.distancia = this.distancia - velocidad;
    }

}
