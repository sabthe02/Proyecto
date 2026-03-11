package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

public class PortaDron extends Elemento {

    List<Dron> drones;
    TipoElemento tipo;
    private int rangoVision;

    public PortaDron(int id,
            Float posicionX,
            Float posicionY,
            float posicionZ,
            Integer angulo,
            Integer vida,
            EstadoElemento estado,
            TipoElemento tipo,
            EntidadJugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
        drones = new java.util.ArrayList<Dron>();
        this.tipo = tipo;
        // El rango de visión es igual al del dron del mismo equipo
        if (tipo == TipoElemento.AEREO) {
            this.rangoVision = 200;
        } else {
            this.rangoVision = 100;
        }
    }

    public int getRangoVision() {
        return rangoVision;
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

    public Dron getDron(int coor) {
        return this.drones.get(coor);
    }

    public void moverse(Evento_Movimiento intencion) {
        if (intencion == null) {
            return;
        }
        this.setPosicionX(intencion.getNuevaPosX());
        this.setPosicionY(intencion.getNuevaPosY());
        this.setAngulo(intencion.getNuevoAngulo());
    }

    // Desplegar un dron desde el portadron
    // Busca el primer dron INACTIVO y lo activa
    public Dron desplegarDron(Evento_DesplegarDron eventoDesplegarDron) {
        Dron dronDesplegado = null;

        // Buscar el primer dron inactivo disponible (solo INACTIVO, no CARGANDO)
        for (int i = 0; i < drones.size(); i++) {
            Dron dron = drones.get(i);
            // Solo desplegar drones INACTIVO con batería completa
            // No desplegar drones CARGANDO (están en proceso de recarga)
            // Busca el dron que tenga municiones
            if (dron.getEstado() == EstadoElemento.INACTIVO && dron.getBateria() >= Dron.MAX_BATERIA) {

                // configura como dron a devolver si no hay ninguno seteado, o si el buscaddo
                // tiene mas municiones que el encontrado antes
                if (dronDesplegado == null) {
                    dronDesplegado = dron;
                } else if (dronDesplegado.cantidadMunicionesDisponibles() < dron.cantidadMunicionesDisponibles()) {
                    dronDesplegado = dron;
                }
            }
        }

        if (dronDesplegado != null) {
            // Activar el dron y desplegarlo
            dronDesplegado.setEstado(EstadoElemento.ACTIVO);
            dronDesplegado.setPosicionX(getPosicionX());
            dronDesplegado.setPosicionY(getPosicionY());
        }

        return dronDesplegado;
    }

    public int cantidadDronesDestruidos() {
        int i = 0;
        for (Dron dron : drones) {
            if (dron.getEstado() == EstadoElemento.DESTRUIDO) {
                i++;
            }
        }
        return i;
    }

    public int cantidadDronesDisponibles() {
        int i = 0;
        for (Dron dron : drones) {
            if (dron.getEstado() == EstadoElemento.INACTIVO) {
                i++;
            }
        }
        return i;
    }

    @Override
    public void recibeImpacto() {

        if (getTipo() == TipoElemento.AEREO) {
            int danos = 16;
            this.setVida(this.getVida() - danos);
            if (this.getVida() <= 5) {
                this.setEstado(EstadoElemento.DESTRUIDO);
                this.setVida(0);
            }
        } else if (getTipo() == TipoElemento.NAVAL) {
            int danos = 33;
            this.setVida(this.getVida() - danos);
            if (this.getVida() <= 2) {
                this.setEstado(EstadoElemento.DESTRUIDO);
                this.setVida(0);
            }
        }

    }

    @Override
    protected int getBateria() {
        return 0;
    }

    @Override
    public int cantidadMunicionesDisponibles() {
        return 0;
    }
}
