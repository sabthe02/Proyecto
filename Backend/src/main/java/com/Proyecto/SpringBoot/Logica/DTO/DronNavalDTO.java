package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.ArrayList;
import java.util.List;

import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Misil;
import com.Proyecto.SpringBoot.Logica.Municion;

public class DronNavalDTO {

    int id;
    float x;
    float y;
    float z;
    int angulo;
    int vida;
    String estado;

    int bateria;

    String tipo = "Naval";
    String tipoMunicion = "MISIL";
    int municionDisponible;

    List<MisilDTO> listaMisiles;

    public DronNavalDTO(int id, float x, float y, float z, int angulo, int vida, String estado, int bateria) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.angulo = angulo;
        this.vida = vida;
        this.estado = estado;
        this.bateria = bateria;
        this.tipoMunicion = "MISIL";
        this.municionDisponible = 0;
        listaMisiles = new ArrayList<>();
    }

    public void agregarMisil(MisilDTO misil)
    {
        listaMisiles.add(misil);
        if (misil != null && !misil.isUsada()) {
            municionDisponible++;
        }
    }

    public void cargarMunicionesDesdeDron(Dron dron)
    {
        if (dron == null || dron.getMuniciones() == null) {
            return;
        }

        for (Municion municion : dron.getMuniciones()) {
            if (municion instanceof Misil) {
                Misil misil = (Misil) municion;
                MisilDTO dto = new MisilDTO(
                        misil.getId(),
                        misil.getPosicionX(),
                        misil.getPosicionY(),
                        misil.getPosicionZ(),
                        misil.getAngulo(),
                        misil.getVida(),
                        misil.getEstado().toString(),
                        misil.getDistancia(),
                        misil.getVelocidad(),
                        misil.isUsada());
                agregarMisil(dto);
            }
        }
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public float getX() {
        return x;
    }

    public void setX(float x) {
        this.x = x;
    }

    public float getY() {
        return y;
    }

    public void setY(float y) {
        this.y = y;
    }

    public float getZ() {
        return z;
    }

    public void setZ(float z) {
        this.z = z;
    }

    public int getAngulo() {
        return angulo;
    }

    public void setAngulo(int angulo) {
        this.angulo = angulo;
    }

    public int getVida() {
        return vida;
    }

    public void setVida(int vida) {
        this.vida = vida;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public int getBateria() {
        return bateria;
    }

    public void setBateria(int bateria) {
        this.bateria = bateria;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getTipoMunicion() {
        return tipoMunicion;
    }

    public void setTipoMunicion(String tipoMunicion) {
        this.tipoMunicion = tipoMunicion;
    }

    public int getMunicionDisponible() {
        return municionDisponible;
    }

    public void setMunicionDisponible(int municionDisponible) {
        this.municionDisponible = municionDisponible;
    }

    public List<MisilDTO> getListaMisiles() {
        return listaMisiles;
    }

    public void setListaMisiles(List<MisilDTO> listaMisiles) {
        this.listaMisiles = listaMisiles;
    }

}
