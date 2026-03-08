package com.Proyecto.SpringBoot.Datos.Entidades;

import com.Proyecto.SpringBoot.Logica.EstadoElemento;

import jakarta.persistence.Entity;

@Entity
public class EntidadBomba extends EntidadMunicion{

    int peso;
    float radioExplosion;

    public EntidadBomba(int id,
            Float posicionX,
            Float posicionY,
            float posicionZ,
            Integer angulo,
            Integer vida,
            EstadoElemento estado,
            EntidadJugador jugador,
            boolean usada,
            int peso,
            float radioExplosion) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador, usada);

        this.peso = peso;
        this.radioExplosion = radioExplosion;
    }

    public EntidadBomba()
    {
        super();
        this.peso = 0;
        this.radioExplosion = 0f;
    }

}
