package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class PortaDron extends Elemento {

    List<Dron> drones;
    TipoElemento tipo;    


    public PortaDron(int id, 
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
                    Jugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado,    jugador);
        drones = new java.util.ArrayList<Dron>();
        this.tipo = tipo;
    }


    public void AgregarDron(Dron dron) {
        drones.add(dron);
    }

    public TipoElemento getTipo() {
        return tipo;
    }

    public void setTipo(TipoElemento tipo) {
        this.tipo = tipo;
    }

    public List<Dron> getDrones() {
        return drones;
    }

    public void setDrones(List<Dron> drones) {
        this.drones = drones;
    }

    
}


