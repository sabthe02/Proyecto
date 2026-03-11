package com.Proyecto.SpringBoot.Datos;

import java.util.ArrayList;
import java.util.List;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadBomba;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadDron;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
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
import com.Proyecto.SpringBoot.Logica.iPartidaService;

public class MapeoSesion {

    public MapeoSesion()
    {

    }

    public EntidadSesion mapearSesionJuego(SesionJuego sesion, EntidadJugador jugador)
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

        entidad.setJugadorPrincipal(jugador);

        return entidad;
    }

    public List<PortaDron> mapearEntidadSesion(EntidadSesion entidad)
    {
        
        List<PortaDron> listaPortaDrons = new ArrayList<>();

        for (EntidadPortadron pdron : entidad.getListaPortadrones()) {
            PortaDron p = new PortaDron(pdron.getIdElemento(), pdron.getPosicionX(), pdron.getPosicionY(), pdron.getPosicionZ(), pdron.getAngulo(), pdron.getVida(), pdron.getEstado(), pdron.getTipo(), pdron.getJugador());
            for (EntidadDron eDron : pdron.getDrones()) {
                Dron d = new Dron(eDron.getIdElemento(), eDron.getPosicionX(), eDron.getPosicionY(), eDron.getPosicionZ(), eDron.getAngulo(), eDron.getVida(), eDron.getEstado(), eDron.getTipo(), eDron.getJugador());   
                
                for (EntidadMunicion eMun : eDron.getMuniciones()) {
                    if(eMun instanceof EntidadBomba)
                    {
                        EntidadBomba eBom = ((EntidadBomba)eMun);
                        Bomba b = new Bomba(eBom.getIdElemento(), eBom.getPosicionX(), eBom.getPosicionY(), eBom.getPosicionZ(), eBom.getAngulo(), eBom.getVida(), eBom.getEstado(), eBom.getPeso(), eBom.getRadioExplosion(), eBom.getJugador());   
                        d.agregarMunicion(b);
                    }                   
                    else if(eMun instanceof EntidadMisil)
                    {
                        EntidadMisil eMisil = ((EntidadMisil)eMun);
                        Misil b = new Misil(eMisil.getIdElemento(), eMisil.getPosicionX(), eMisil.getPosicionY(), eMisil.getPosicionZ(), eMisil.getAngulo(), eMisil.getVida(), eMisil.getEstado(), eMisil.getVelocidad(), eMisil.getDistancia(), eMisil.getJugador());   
                        d.agregarMunicion(b);
                    }
                }
                p.AgregarDron(d);
            }
            listaPortaDrons.add(p);
        }

        return listaPortaDrons;
    }
}
