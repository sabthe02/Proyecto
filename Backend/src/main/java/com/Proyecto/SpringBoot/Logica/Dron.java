package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Dron extends Elemento {

    int bateria;
    List<Municion> municiones;
    TipoElemento tipo;

    public Dron(int id, Float posicionX, Float posicionY, float posicionZ, Integer angulo, Integer vida,
            EstadoElemento estado, int cantidadMiniciones, int cantidadUsada, int bateria, TipoElemento tipo, Jugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);

        municiones = new java.util.ArrayList<Municion>();
        this.bateria = bateria;
        this.tipo = tipo;

    }

    public Municion agregarMunicion(int idMunicion) {

        Municion municion = null;
        if (tipo == TipoElemento.AEREO) {
            municion = new Bomba(idMunicion, jugador);
        } else if (tipo == TipoElemento.NAVAL) {
            municion = new Misil(idMunicion, jugador);
        }

        municiones.add(municion);
        return municion;

    }

    public TipoElemento getTipo() {
        return tipo;
    }

    public void setTipo(TipoElemento tipo) {
        this.tipo = tipo;
    }

    public void setBateria(int bateria) {
        this.bateria = bateria;
    }

    public void setMuniciones(List<Municion> municiones) {
        this.municiones = municiones;
    }

    public int cantidadMunicionesUsadas() {
        int i = 0;
        for (Municion municion : municiones) {
            if (municion.isUsada()) {
                i++;
            }
        }
        return i;
    }

    public int cantidadMunicionesDisponibles() {
        int i = 0;
        for (Municion municion : municiones) {
            if (!municion.isUsada()) {
                i++;
            }
        }
        return i;
    }

    public int getBateria() {
        return bateria;
    }

    public List<Municion> getMuniciones() {
        return municiones;
    }

}
