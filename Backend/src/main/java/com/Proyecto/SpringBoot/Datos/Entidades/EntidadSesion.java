package com.Proyecto.SpringBoot.Datos.Entidades;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OneToMany;


@Entity
public class EntidadSesion {

    @Id
    private String idSesion;

    @OneToMany (cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EntidadPortadron> listaPortadrones;

    @ManyToMany
    private List<EntidadJugador> listaJugadores;

    public EntidadSesion(String idSesion)
    {
        listaPortadrones = new ArrayList<>();
        listaJugadores = new ArrayList<>();
        this.idSesion = idSesion;
    }

    public EntidadSesion()
    {
         listaPortadrones = new ArrayList<>();
                 listaJugadores = new ArrayList<>();

        this.idSesion = "";
    }

    public void agregarPortaDron(EntidadPortadron pDron)
    {
        listaPortadrones.add(pDron);
    }

    public void agregarJugador(EntidadJugador jugador)
    {
        listaJugadores.add(jugador);
    }

    public String getIdSesion()
    {return idSesion;}

    public int getCandidadPortaDron()
    {
        return listaPortadrones.size();
    }

    public List<EntidadPortadron> getListaPortadrones() {
        return listaPortadrones;
    }

    public void setListaPortadrones(List<EntidadPortadron> listaPortadrones) {
        this.listaPortadrones = listaPortadrones;
    }

    public List<EntidadJugador> getListaJugadores() {
        return listaJugadores;
    }

    public void setListaJugadores(List<EntidadJugador> listaJugadores) {
        this.listaJugadores = listaJugadores;
    }

    public void setIdSesion(String idSesion) {
        this.idSesion = idSesion;
    }

    
}
