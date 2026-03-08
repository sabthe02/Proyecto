package com.Proyecto.SpringBoot.Datos;

import java.util.ArrayList;
import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadBomba;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadDron;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadMisil;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadMunicion;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadPortadron;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadSesion;
import com.Proyecto.SpringBoot.Logica.Bomba;
import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Misil;
import com.Proyecto.SpringBoot.Logica.Municion;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.SesionJuego;

public class MapeoSesion {

    public MapeoSesion()
    {

    }

    public EntidadSesion mapearSesionJuego(SesionJuego sesion)
    {
        EntidadSesion entidad = new EntidadSesion(sesion.getIdSesion());

        //Para cada PortaDron en la partida:
        for (PortaDron pDron : sesion.getElementosJugadores().values()) {
            entidad.agregarJugador(pDron.getJugador());
            List<EntidadDron> listaDr = new ArrayList<>();

            //Creo la lista de drones y luego lo agrego al portadron
            for(Dron dr : pDron.getDrones())
            {
                EntidadDron eDr = new EntidadDron(
                    dr.getId(), 
                    dr.getPosicionX(), 
                    dr.getPosicionY(),
                    dr.getPosicionZ(),
                    dr.getAngulo(),
                    dr.getVida(),
                    dr.getEstado(), 
                    dr.cantidadMunicionesDisponibles(),
                    dr.cantidadMunicionesUsadas(),
                    dr.getBateria(),
                    dr.getTipo(),
                    dr.getJugador()
                );

                List<EntidadMunicion> lMunicion = new ArrayList<>();

                for(Municion m : dr.getMuniciones())
                {
                    if(m instanceof Bomba)
                    {
                        Bomba b = (Bomba)m;
                        lMunicion.add(new EntidadBomba(b.getId(), b.getPosicionX(),b.getPosicionY(), b.getPosicionZ(), b.getAngulo(), b.getVida(), b.getEstado(), b.getJugador(), b.isUsada(), b.getPeso(), b.getRadioExplosion()));
                    }else if(m instanceof Misil)
                    {
                        Misil b = (Misil)m;
                        lMunicion.add(new EntidadMisil(b.getId(), b.getPosicionX(),b.getPosicionY(), b.getPosicionZ(), b.getAngulo(), b.getVida(), b.getEstado(), b.getJugador(), b.isUsada(), b.getVelocidad(), b.getDistancia()));
                    }
                }
                eDr.setMuniciones(lMunicion);

                listaDr.add(eDr);
            }

            EntidadPortadron epDron = new EntidadPortadron(
                    pDron.getId(), 
                    pDron.getPosicionX(), 
                    pDron.getPosicionY(),
                    pDron.getPosicionZ(),
                    pDron.getAngulo(),
                    pDron.getVida(),
                    pDron.getEstado(), 
                    pDron.getTipo(),
                    listaDr,
                    pDron.getJugador()
                );
            entidad.agregarPortaDron(epDron);
            
        }

        return entidad;
    }

    public SesionJuego mapearEntidadSesion(EntidadSesion entidad)
    {
        SesionJuego sesion = null;

        sesion = new SesionJuego(entidad.getIdSesion(), entidad.getListaJugadores(), null);


        return sesion;
    }
}
