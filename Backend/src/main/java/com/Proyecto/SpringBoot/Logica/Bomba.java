package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Bomba extends Municion {

    int peso;
    float radioExplosion;
    private float gravedad = 0.5f;
    private float velocidadInicio = 0;

    public Bomba(int id, Jugador jugador) {
        super(id, jugador);
        this.peso = 100;
        this.radioExplosion = 5f;
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
                Jugador jugador) {
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

    public void reiniciarVelocidadInicio() {
        this.velocidadInicio = 0;
    }

    @Override
    public void moverse(Evento_Movimiento intencion) {
        velocidadInicio = velocidadInicio + gravedad;
        Bomba bomba = (Bomba) intencion.getElemento();
        bomba.setPosicionZ(bomba.getPosicionZ() - velocidadInicio);        
        
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

}
