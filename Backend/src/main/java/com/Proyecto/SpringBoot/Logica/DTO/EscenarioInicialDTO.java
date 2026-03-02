package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.ArrayList;
import java.util.List;

public class EscenarioInicialDTO {

    List<JugadorDTO> listaJugadores;
    List<PortaDronAereoDTO> listaPortaDronesAereos;
    List<PortaDronNavalDTO> listaPortaDronesNavales;
    MapaDTO mapa;

    public EscenarioInicialDTO()
    {
        listaJugadores = new ArrayList<>();
        listaPortaDronesAereos = new ArrayList<>();
        listaPortaDronesNavales = new ArrayList<>();
        mapa = new MapaDTO();
    }

    public List<JugadorDTO> getListaJugadores() {
        return listaJugadores;
    }

    public List<PortaDronAereoDTO> getListaPortaDronesAereos() {
        return listaPortaDronesAereos;
    }

    public List<PortaDronNavalDTO> getListaPortaDronesNavales() {
        return listaPortaDronesNavales;
    }

    public MapaDTO getMapa()
    {
        return mapa;
    }

    public void agregarMapa(MapaDTO mapa)
    {
        this.mapa = mapa;
    }

    public void agregarJugador(JugadorDTO jugador)
    {
        listaJugadores.add(jugador);
    }

    public void agregarPortaDronAereo(PortaDronAereoDTO portaDron)
    {
        listaPortaDronesAereos.add(portaDron);
    }
    public void agregarPortaDronNaval(PortaDronNavalDTO portaDron)
    {
        listaPortaDronesNavales.add(portaDron);
    }

}
