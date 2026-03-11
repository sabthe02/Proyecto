package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.ArrayList;
import java.util.List;

public class CambiosDTO {


    private List<Object> elementos;
    private List<Object> eventos;

    public CambiosDTO()
    {
        elementos = new ArrayList<>();
        eventos = new ArrayList<>();
    }

    public void insertarElemento(Object elemento) {
        elementos.add(elemento);
    }


    public void insertarEvento(Object elemento) {
        eventos.add(elemento);
    }


    public List<Object> getElementos() {
        return elementos;
    }

    public void setElementos(List<Object> elementos) {
        this.elementos = elementos;
    }

    public List<Object> getEventos() {
        return eventos;
    }

    public void setEventos(List<Object> eventos) {
        this.eventos = eventos;
    }

    
}
