package com.Proyecto.SpringBoot.Datos.Entidades;

import com.Proyecto.SpringBoot.Logica.EstadoElemento;

import jakarta.persistence.Entity;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public class EntidadMunicion extends EntidadElemento{

    boolean usada;

    public EntidadMunicion(int id,
            Float posicionX,
            Float posicionY,
            float posicionZ,
            Integer angulo,
            Integer vida,
            EstadoElemento estado,
            EntidadJugador jugador, boolean usada) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
    
        this.usada = usada;

    }

    public EntidadMunicion()
    {
        super();
        this.usada = false;
    }

}
