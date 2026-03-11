package com.Proyecto.SpringBoot.Datos.Entidades;

import java.util.ArrayList;
import java.util.List;

import org.aspectj.weaver.patterns.ArgsAnnotationPointcut;

import com.Proyecto.SpringBoot.Logica.EstadoElemento;
import com.Proyecto.SpringBoot.Logica.TipoElemento;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;

@Entity
public class EntidadDron extends EntidadElemento{

    private int bateria;

    @OneToMany (cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<EntidadMunicion> municiones;
    private TipoElemento tipo;

    public EntidadDron() {
        super();
        municiones = new ArrayList<>();
    }

    public EntidadDron(int id,
            Float posicionX,
            Float posicionY,
            float posicionZ,
            Integer angulo,
            Integer vida,
            EstadoElemento estado,
            int cantidadMiniciones,
            int cantidadUsada,
            int bateria,
            TipoElemento tipo,
            EntidadJugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);

        municiones = new java.util.ArrayList<EntidadMunicion>();
        this.bateria = bateria;
        this.tipo = tipo;

    }

    public int getBateria() {
        return bateria;
    }

    public void setBateria(int bateria) {
        this.bateria = bateria;
    }

    public List<EntidadMunicion> getMuniciones() {
        return municiones;
    }

    public void setMuniciones(List<EntidadMunicion> municiones) {
        this.municiones = municiones;
    }

    public TipoElemento getTipo() {
        return tipo;
    }

    public void setTipo(TipoElemento tipo) {
        this.tipo = tipo;
    }

}
