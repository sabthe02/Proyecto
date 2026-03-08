package com.Proyecto.SpringBoot.Datos.Entidades;

import java.util.ArrayList;
import java.util.List;

import com.Proyecto.SpringBoot.Logica.EstadoElemento;
import com.Proyecto.SpringBoot.Logica.TipoElemento;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

@Entity
public class EntidadPortadron extends EntidadElemento {

    @OneToMany (cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntidadDron> drones;
    private TipoElemento tipo;

    public EntidadPortadron()
    {
        super();
        drones = new ArrayList<>();
        tipo = TipoElemento.AEREO;
    }

     public EntidadPortadron(int id,
            Float posicionX,
            Float posicionY,
            float posicionZ,
            Integer angulo,
            Integer vida,
            EstadoElemento estado,
            TipoElemento tipo,
            List<EntidadDron> listaDrones,
            EntidadJugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);

        this.drones = listaDrones;
        this.tipo = tipo;

    }

    public List<EntidadDron> getDrones() {
        return drones;
    }

    public void setDrones(List<EntidadDron> drones) {
        this.drones = drones;
    }

    public TipoElemento getTipo() {
        return tipo;
    }

    public void setTipo(TipoElemento tipo) {
        this.tipo = tipo;
    }



}
