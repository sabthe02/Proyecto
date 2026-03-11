package com.Proyecto.SpringBoot.Logica.DTO;

import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Misil;

public class RecibeImpactoDTO {

    int idElemento;
    String tipoProyectil;
    String claseObjeto;
    String evento = "RECIBIR_DANO";


    public RecibeImpactoDTO() {
    }

    public RecibeImpactoDTO(int idElemento, String tipoProyectil, String claseObjeto) {
        this.idElemento = idElemento;
        this.tipoProyectil = tipoProyectil;
        this.claseObjeto = claseObjeto;
    }

    public int getIdElemento() {
        return idElemento;
    }

    public void setIdElemento(int idElemento) {
        this.idElemento = idElemento;
    }

    public String getTipoProyectil() {
        return tipoProyectil;
    }

    public void setTipoProyectil(String tipoProyectil) {
        this.tipoProyectil = tipoProyectil;
    }

    public String getClaseObjeto() {
        return claseObjeto;
    }

    public void setClaseObjeto(String claseObjeto) {
        this.claseObjeto = claseObjeto;
    }

   
public String getEvento() {
    return evento;
}

public void setEvento(String evento) {
    this.evento = evento;
}

}
