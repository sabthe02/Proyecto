package com.Proyecto.SpringBoot.Logica;

import java.util.List;
import java.util.Map;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Dron extends Elemento {

    int bateria;
    List<Municion> municiones;
    TipoElemento tipo;
    public static final int MAX_BATERIA = 100;
    private int recargaPorTick = 1;

    public Dron(int id, 
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
                Jugador jugador) {
        super(id, posicionX, posicionY, posicionZ, angulo, vida, estado, jugador);

        municiones = new java.util.ArrayList<Municion>();
        this.bateria = MAX_BATERIA;
        this.tipo = tipo;

    }

    public Municion agregarMunicion(int idMunicion) {

        Municion municion = null;
        if (tipo == TipoElemento.AEREO) {
            municion = new Bomba(idMunicion, jugador);
        } else if (tipo == TipoElemento.NAVAL) {
            municion = new Misil(idMunicion, jugador);
        }

        municiones.add(municion);
        return municion;

    }

    public int getCantidadMunicionInicial() {
        if (tipo == TipoElemento.AEREO) {
            return 1;
        }

        if (tipo == TipoElemento.NAVAL) {
            return 2;
        }

        return 0;
    }

    public void cargarMunicionInicial(Map<Integer, Elemento> elementosEnJuego) {
        if (elementosEnJuego == null) {
            return;
        }

        int cantidadMunicionInicial = getCantidadMunicionInicial();
        int i = 0;
        while (i < cantidadMunicionInicial) {
            int idMunicion = elementosEnJuego.size();
            Municion municion = agregarMunicion(idMunicion);
            if (municion != null) {
                elementosEnJuego.put(idMunicion, municion);
            }
            i++;
        }
    }

    public TipoElemento getTipo() {
        return tipo;
    }

    public void setTipo(TipoElemento tipo) {
        this.tipo = tipo;
    }

    public void setBateria(int bateria) {
        this.bateria = bateria;
    }

    public void setMuniciones(List<Municion> municiones) {
        this.municiones = municiones;
    }

    public int cantidadMunicionesUsadas() {
        int i = 0;
        for (Municion municion : municiones) {
            if (municion.isUsada()) {
                i++;
            }
        }
        return i;
    }

    public int cantidadMunicionesDisponibles() {
        int i = 0;
        for (Municion municion : municiones) {
            if (!municion.isUsada()) {
                i++;
            }
        }
        return i;
    }

    public int getBateria() {
        return bateria;
    }

    public int getMAX_BATERIA() {
        return MAX_BATERIA;
    }

    public List<Municion> getMuniciones() {
        return municiones;
    }

    public void moverse(Evento_Movimiento intencion) {
        if (intencion == null) {
            return;
        }
        this.setPosicionX(intencion.getNuevaPosX());
        this.setPosicionY(intencion.getNuevaPosY());
        this.setAngulo(intencion.getNuevoAngulo());
    }

    public void consumirBateriaPorMovimiento() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'consumirBateriaPorMovimiento'");
    }

    public Elemento disparar(Evento_Disparo intencion) {
         
        if (this.getTipo() == TipoElemento.AEREO) {
            int vidaNueva = 100;
            int pesoNuevo = 100;
            float radioExplosionNuevo = 50f;
            Bomba bomba = new Bomba(generarId(), this.getPosicionX(), this.getPosicionY(), this.getPosicionZ(), this.getAngulo(), vidaNueva, EstadoElemento.ACTIVO, pesoNuevo, radioExplosionNuevo, jugador);
            return bomba;
        } else if (this.getTipo() == TipoElemento.NAVAL) {
            int vidaNueva = 100;
            int velocidadNueva = 10;
            float distanciaNuevo = 7f;
            Misil misil = new Misil(generarId(), this.getPosicionX(), this.getPosicionY(), this.getPosicionZ(), this.getAngulo(), vidaNueva, EstadoElemento.ACTIVO, velocidadNueva, distanciaNuevo, jugador);
            return misil;
        }
        return null;
    }

    private int generarId() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'generarId'");
    }

    public void recargar(Evento_Recarga intencion) {
        if(this.estado == EstadoElemento.CARGANDO) return;

        this.bateria = Math.min(this.bateria + recargaPorTick, MAX_BATERIA);

        if(this.bateria >= MAX_BATERIA) {
            this.estado = EstadoElemento.INACTIVO;
            intencion.deshabilitar();
        }
        
    }

}
