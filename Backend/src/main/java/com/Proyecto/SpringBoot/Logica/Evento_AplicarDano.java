package com.Proyecto.SpringBoot.Logica;

public class Evento_AplicarDano extends Evento {

    private int dano;
    private int vidaRestante;
    private boolean estaDestruido;
    private String claseProyectil;

    public Evento_AplicarDano() {
        super();
        this.dano = 0;
        this.vidaRestante = 0;
        this.estaDestruido = false;
        this.claseProyectil = "";
    }

    public Evento_AplicarDano(Elemento objetivo, int dano, int vidaRestante, boolean estaDestruido, String claseProyectil) {
        super(objetivo);
        this.dano = dano;
        this.vidaRestante = vidaRestante;
        this.estaDestruido = estaDestruido;
        this.claseProyectil = claseProyectil;
    }

    public int getVidaRestante() {
        return vidaRestante;
    }

    public void setVidaRestante(int vidaRestante) {
        this.vidaRestante = vidaRestante;
    }

    public boolean isEstaDestruido() {
        return estaDestruido;
    }

    public void setEstaDestruido(boolean estaDestruido) {
        this.estaDestruido = estaDestruido;
    }

    public String getClaseProyectil() {
        return claseProyectil;
    }

    public void setClaseProyectil(String claseProyectil) {
        this.claseProyectil = claseProyectil;
    }

    public int getDano() {
        return dano;
    }

    public void setDano(int dano) {
        this.dano = dano;
    }
}
