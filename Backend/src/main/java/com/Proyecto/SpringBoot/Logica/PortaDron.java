package com.Proyecto.SpringBoot.Logica;

import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

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
            EntidadJugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);
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

        // Buscar el primer dron inactivo disponible
        for (int i = 0; i < drones.size(); i++) {
            Dron dron = drones.get(i);
            if (dron.getEstado() == EstadoElemento.INACTIVO) {
                // Activar el dron y desplegarlo
                dron.setEstado(EstadoElemento.ACTIVO);
                dronDesplegado = dron;
                // Salir del bucle una vez encontrado
                i = drones.size();
            }
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
    public void recibeImpacto(Evento_Movimiento intencion) {
        PortaDron portaDron = (PortaDron) intencion.getElemento();
        if (portaDron.getTipo() == TipoElemento.AEREO) {
            int danos = 16;
            this.setVida(this.getVida()-danos);
            if (this.getVida() <= 5) {
                this.setEstado(EstadoElemento.DESTRUIDO);
                this.setVida(0);
            }
        }
        else if (portaDron.getTipo() == TipoElemento.NAVAL) {
            int danos = 33;
            this.setVida(this.getVida()-danos);
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
}
