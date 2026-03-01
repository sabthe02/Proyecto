package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.ArrayList;
import java.util.List;

import com.Proyecto.SpringBoot.Logica.Bomba;
import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Municion;

public class DronAereoDTO {
int id;
    float x;
    float y;
    float z;
    int angulo;
    int vida;
    String estado;

    int bateria;

    String tipo = "Aereo";
    String tipoMunicion = "BOMBA";
    int municionDisponible;

    List<BombaDTO> listaBombas;

    public DronAereoDTO(int id, float x, float y, float z, int angulo, int vida, String estado, int bateria) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.angulo = angulo;
        this.vida = vida;
        this.estado = estado;
        this.bateria = bateria;
        tipoMunicion = "BOMBA";
        municionDisponible = 0;
        listaBombas = new ArrayList<>();
    }

    public void agregarBomba(BombaDTO bomba)
    {
        listaBombas.add(bomba);
        if (bomba != null && !bomba.isUsada()) {
            municionDisponible++;
        }
    }

    public void cargarMunicionesDesdeDron(Dron dron)
    {
        if (dron == null || dron.getMuniciones() == null) {
            return;
        }

        for (Municion municion : dron.getMuniciones()) {
            if (municion instanceof Bomba) {
                Bomba bomba = (Bomba) municion;
                BombaDTO dto = new BombaDTO(
                        bomba.getId(),
                        bomba.getPosicionX(),
                        bomba.getPosicionY(),
                        bomba.getPosicionZ(),
                        bomba.getAngulo(),
                        bomba.getVida(),
                        bomba.getEstado().toString(),
                        bomba.getRadioExplosion(),
                        bomba.isUsada());
                agregarBomba(dto);
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

    public List<BombaDTO> getListaBombas() {
        return listaBombas;
    }

    public void setListaBombas(List<BombaDTO> listaBombas) {
        this.listaBombas = listaBombas;
    }

}
