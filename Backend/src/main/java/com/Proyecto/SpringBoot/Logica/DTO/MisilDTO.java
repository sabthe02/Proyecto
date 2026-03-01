package com.Proyecto.SpringBoot.Logica.DTO;

public class MisilDTO {

    int id;
    float x;
    float y;
    float z;
    int angulo;
    int vida;
    String estado;

    float alcance;
    int velocidad;
    boolean usada;

    public MisilDTO(int id, float x, float y, float z, int angulo, int vida, String estado, float alcance) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.angulo = angulo;
        this.vida = vida;
        this.estado = estado;
        this.alcance = alcance;
        this.velocidad = 0;
        this.usada = false;
    }

    public MisilDTO(int id, float x, float y, float z, int angulo, int vida, String estado, float alcance, int velocidad, boolean usada) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.angulo = angulo;
        this.vida = vida;
        this.estado = estado;
        this.alcance = alcance;
        this.velocidad = velocidad;
        this.usada = usada;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public float getX() {
        return x;
    }

    public void setX(float x) {
        this.x = x;
    }

    public float getY() {
        return y;
    }

    public void setY(float y) {
        this.y = y;
    }

    public float getZ() {
        return z;
    }

    public void setZ(float z) {
        this.z = z;
    }

    public int getAngulo() {
        return angulo;
    }

    public void setAngulo(int angulo) {
        this.angulo = angulo;
    }

    public int getVida() {
        return vida;
    }

    public void setVida(int vida) {
        this.vida = vida;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public float getAlcance() {
        return alcance;
    }

    public void setAlcance(float alcance) {
        this.alcance = alcance;
    }

    public int getVelocidad() {
        return velocidad;
    }

    public void setVelocidad(int velocidad) {
        this.velocidad = velocidad;
    }

    public boolean isUsada() {
        return usada;
    }

    public void setUsada(boolean usada) {
        this.usada = usada;
    }

}
