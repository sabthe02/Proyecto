package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class Bomba extends Municion {

    int peso;
    float radioExplosion;
    private float gravedad = 0.5f;
    private float velocidadInicio = 0;
    private float distancia;
    private final float DIS_MAX = 1500f;

    public Bomba(int id, EntidadJugador jugador, float posZ) {
        super(id, jugador);
        this.peso = 100;
        this.radioExplosion = 205f;
        this.distancia = DIS_MAX;
        this.posicionZ = posZ;
    }

    public Bomba(int id, 
                Float posicionX, 
                Float posicionY, 
                float posicionZ, 
                Integer angulo, 
                Integer vida,
                EstadoElemento estado, 
                int peso, 
                float radioExplosion, 
                EntidadJugador jugador) {
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

    public float getDistancia() {
        return distancia;
    }

    public float calculoDeNuevaPosicion() {
       float velocidadInicioaux = velocidadInicio + gravedad;
       return getPosicionZ() - velocidadInicioaux;   
    }

    public void setDistanciaMaxima(float distanciaMaxima) {
        this.distancia = distanciaMaxima;
    }

    public void reiniciarVelocidadInicio() {
        this.velocidadInicio = 0;
        this.distancia = DIS_MAX;
    }

    @Override
    public void moverse(Evento_Movimiento intencion) {    
        velocidadInicio = velocidadInicio + gravedad;
        Bomba bomba = (Bomba) intencion.getElemento();
        bomba.setPosicionZ(bomba.getPosicionZ() - velocidadInicio);        
    }

    @Override
    public void recibeImpacto() {
        
    }

    @Override
    protected TipoElemento getTipo() {
        return TipoElemento.AEREO;
    }

    @Override
    protected int getBateria() {
        return 0;
    }

    public float getVelocidadInicio() {
        return velocidadInicio;
    }

    @Override
    public int cantidadMunicionesDisponibles() {
        return 0;
    }

}
