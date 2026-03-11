package com.Proyecto.SpringBoot.Datos.Entidades;

import com.Proyecto.SpringBoot.Logica.EstadoElemento;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public abstract class EntidadElemento {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private int idClave;

    protected int idElemento;
    protected Float posicionX;
    protected Float posicionY;
    protected float posicionZ;
    protected Integer angulo;
    protected Integer vida;
    protected EstadoElemento estado;

    @ManyToOne
    @JoinColumn(name="id")
    protected EntidadJugador jugador;


   

        public EntidadElemento(
            int idElemento, 
            Float posicionX, 
            Float posicionY, 
            float posicionZ,
             Integer angulo, 
             Integer vida, EstadoElemento estado,
             EntidadJugador jugador
            ) {
            this.idElemento = idElemento;
            this.posicionX = posicionX;
            this.posicionY = posicionY;
            this.posicionZ = posicionZ;
            this.angulo = angulo;
            this.vida = vida;
            this.jugador = jugador;
            this.estado = estado;
        }

        public EntidadElemento()
        {
            this.idElemento = 0;
            this.posicionX = 0f;
            this.posicionY = 0f;
            this.posicionZ = 0f;
            this.angulo = 0;
            this.vida = 100;
            this.jugador = new EntidadJugador();
            this.estado = EstadoElemento.ACTIVO;

        }

        public int getIdClave() {
            return idClave;
        }

        public void setIdClave(int idClave) {
            this.idClave = idClave;
        }

        public int getIdElemento() {
            return idElemento;
        }

        public void setIdElemento(int idElemento) {
            this.idElemento = idElemento;
        }

        public Float getPosicionX() {
            return posicionX;
        }

        public void setPosicionX(Float posicionX) {
            this.posicionX = posicionX;
        }

        public Float getPosicionY() {
            return posicionY;
        }

        public void setPosicionY(Float posicionY) {
            this.posicionY = posicionY;
        }

        public float getPosicionZ() {
            return posicionZ;
        }

        public void setPosicionZ(float posicionZ) {
            this.posicionZ = posicionZ;
        }

        public Integer getAngulo() {
            return angulo;
        }

        public void setAngulo(Integer angulo) {
            this.angulo = angulo;
        }

        public Integer getVida() {
            return vida;
        }

        public void setVida(Integer vida) {
            this.vida = vida;
        }

        public EntidadJugador getJugador() {
            return jugador;
        }

        public void setJugador(EntidadJugador jugador) {
            this.jugador = jugador;
        }

        public EstadoElemento getEstado() {
            return estado;
        }

        public void setEstado(EstadoElemento estado) {
            this.estado = estado;
        }




}
