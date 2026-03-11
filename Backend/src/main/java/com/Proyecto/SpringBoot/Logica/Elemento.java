package com.Proyecto.SpringBoot.Logica;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public abstract class Elemento {

    int id;
    Float posicionX;
    Float posicionY;
    float posicionZ;
    Integer angulo;
    Integer vida;
    EntidadJugador jugador;
    public static final float MAX_ALTURA = 100;

    EstadoElemento estado;

    public Elemento() {
        id = 0;
        posicionX = 0f;
        posicionY = 0f;
        posicionZ = MAX_ALTURA;
        angulo = 0;
        vida = 100;
        estado = EstadoElemento.ACTIVO;
        jugador = null;
    }

    public Elemento(int id, EntidadJugador jugador) {
        this.id = id;
        this.jugador = jugador;
        posicionX = 0f;
        posicionY = 0f;
        posicionZ = MAX_ALTURA;
        angulo = 0;
        vida = 100;
        estado = EstadoElemento.ACTIVO;
    }

    public Elemento(int id,
            float posicionX2,
            float posicionY2,
            float posicionZ,
            Integer angulo,
            Integer vida,
            EstadoElemento estado,
            EntidadJugador jugador) {
        this.id = id;
        this.posicionX = posicionX2;
        this.posicionY = posicionY2;
        this.posicionZ = posicionZ;
        this.angulo = angulo;
        if (vida != null) {
            this.vida = vida;
        } else {
            this.vida = 100;
        }
        this.estado = estado;
        this.jugador = jugador;
    }

    public int getId() {
        return id;
    }

    public Float getPosicionX() {
        return posicionX;
    }

    public Float getPosicionY() {
        return posicionY;
    }

    public float getPosicionZ() {
        return posicionZ;
    }

    public Integer getAngulo() {
        return angulo;
    }

    public Integer getVida() {
        return vida;
    }

    public EstadoElemento getEstado() {
        return estado;
    }



    public void setPosicionX(Float posicionX) {
        this.posicionX = posicionX;
    }

    public void setPosicionY(Float posicionY) {
        this.posicionY = posicionY;
    }

    public void setPosicionZ(float posicionZ) {
        this.posicionZ = posicionZ;
    }

    public void setAngulo(Integer angulo) {
        this.angulo = angulo;
    }

    public void setVida(Integer vida) {
        this.vida = vida;
    }

    public void setEstado(EstadoElemento estado) {
        this.estado = estado;
    }

    public EntidadJugador getJugador() {
        return jugador;
    }

    public void setJugador(EntidadJugador jugador) {
        this.jugador = jugador;
    }
    
    public String getIdJugador() {
        if (jugador != null) {
            return jugador.getId(); // Para que se serialice el ID del jugador en lugar del objeto completo
        }
        return null;
    }

    public float getMAX_ALTURA() {
        return MAX_ALTURA;
    }

   

    public abstract void moverse(Evento_Movimiento intencion); 

    public abstract void recibeImpacto();

    protected abstract TipoElemento getTipo();

    protected abstract int getBateria();

    public abstract int cantidadMunicionesDisponibles();

}
