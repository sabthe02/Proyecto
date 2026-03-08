package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.ArrayList;
import java.util.List;

public class CambiosDTO {


    private List<Object> elementosNuevos;
    private List<Object> elementos;

    public CambiosDTO()
    {
        elementosNuevos = new ArrayList<>();
        elementos = new ArrayList<>();
    }

    public void insertarElemento(Object elemento) {
        elementosNuevos.add(elemento);
        elementos.add(elemento);
    }

    public List<Object> getElementos() {
        return elementosNuevos;
    }

}
