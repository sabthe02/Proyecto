package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.ArrayList;
import java.util.List;

public class PortaDronAereoDTO {
    int id;
    float x;
    float y;
    float z;
    int angulo;
    int vida;
    String estado;
    String nickName;
    String jugadorId;

    String tipo = "Aereo";

    List<DronAereoDTO> listaDrones;

    public PortaDronAereoDTO(int id, float x, float y, float z, int angulo, int vida, String estado, String nickName, String jugadorId)
    {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
        this.angulo = angulo;
        this.vida = vida;
        this.estado = estado;
        this.nickName = nickName;
        this.jugadorId = jugadorId;

        listaDrones = new ArrayList<>();
    }

    public void agregarDron(DronAereoDTO dron)
    {
        listaDrones.add(dron);
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

    public String getTipo() {
        return tipo;
    }

    public String getNickName() {
        return nickName;
    }

    public String getJugadorId() {
        return jugadorId;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public void setJugadorId(String jugadorId) {
        this.jugadorId = jugadorId;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public List<DronAereoDTO> getListaDrones() {
        return listaDrones;
    }

    public void setListaDrones(List<DronAereoDTO> listaDrones) {
        this.listaDrones = listaDrones;
    }
}
