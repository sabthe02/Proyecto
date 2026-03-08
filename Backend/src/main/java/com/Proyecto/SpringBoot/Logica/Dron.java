package com.Proyecto.SpringBoot.Logica;

import java.util.List;
import java.util.Map;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class Dron extends Elemento {

    int bateria;
    List<Municion> municiones;
    TipoElemento tipo;
    public static final int MAX_BATERIA = 1000;
    private int recargaPorTick = 1;
    private long comenzandoCarga = 0;

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
        Dron dron = (Dron) intencion.getElemento();
        // No forzar ACTIVO si el dron ya esta DESTRUIDO
        if (dron.getEstado() != EstadoElemento.DESTRUIDO) {
            dron.setEstado(EstadoElemento.ACTIVO);
        }
        this.setPosicionX(intencion.getNuevaPosX());
        this.setPosicionY(intencion.getNuevaPosY());
        this.setAngulo(intencion.getNuevoAngulo());
        this.consumirBateriaPorMovimiento();
    }

    public void consumirBateriaPorMovimiento() {
        if (this.estado != EstadoElemento.ACTIVO) {
            return;
        }
        
        // Consume bateria al moverse
        this.bateria = Math.max(this.bateria - recargaPorTick, 0);
        
        // Si se agota la bateria, el dron se destruye
        if (this.bateria <= 0) {
            this.estado = EstadoElemento.DESTRUIDO;
        }
    }

    public Elemento disparar(Evento_Disparo intencion) {

        if (this.getTipo() == TipoElemento.AEREO) {

            if(this.cantidadMunicionesDisponibles() <= 0) {
                this.municiones.get(0).setUsada(true);
                return this.municiones.get(0);
            }

        } else if (this.getTipo() == TipoElemento.NAVAL) {
            
            for (Municion municion : municiones) {
                if (!municion.isUsada()) {
                    municion.setUsada(true);
                    return municion;
                }
            }
            
        }
        return null;
    }

    private int generarId() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'generarId'");
    }

    public void recargar(Evento_Recarga intencion) {
        if (this.estado != EstadoElemento.CARGANDO)
            return;

        this.bateria = Math.min(this.bateria + recargaPorTick, MAX_BATERIA);

        if (this.bateria >= MAX_BATERIA) {
            this.estado = EstadoElemento.INACTIVO;
            intencion.deshabilitar();
        }

    }

    public void descargaBateria() {
        if (this.estado != EstadoElemento.ACTIVO)
            return;

        this.bateria = Math.max(this.bateria - recargaPorTick, 0);

        if (this.bateria <= 0) {
            this.estado = EstadoElemento.DESTRUIDO;
        }

    }

    public void recargaMunicion(Evento_Recarga eventoRecarga) {
        if (this.estado != EstadoElemento.CARGANDO)
            return;
        this.setComenzandoCarga(this.getComenzandoCarga() + 1);
        if (this.getComenzandoCarga() >= 1000) {
            for (Municion municion : municiones) {
                if (municion.isUsada()) {
                    municion.setUsada(false);
                    if (municion instanceof Bomba) {
                        ((Bomba) municion).reiniciarVelocidadInicio();
                        ((Bomba) municion).setPosicionZ(Bomba.MAX_ALTURA);
                        ((Bomba) municion).setEstado(EstadoElemento.INACTIVO);
                    }
                }
            }
            this.setComenzandoCarga(0); 
            eventoRecarga.finalizarCarga();
            eventoRecarga.deshabilitar();

        }
    }

    public EstadoElemento getEstado() {
        return estado;
    }

    public void setEstado(EstadoElemento estado) {
        this.estado = estado;
    }   

    @Override
    public void recibeImpacto(Evento_Movimiento intencion) {
        this.setVida(0);
        this.setEstado(EstadoElemento.DESTRUIDO);
    }

    public long getComenzandoCarga() {
        return comenzandoCarga;
    }

    public void setComenzandoCarga(long comenzandoCarga) {
        this.comenzandoCarga = comenzandoCarga;
    }

}
