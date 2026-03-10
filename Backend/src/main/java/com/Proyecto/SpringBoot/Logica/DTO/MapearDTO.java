package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.List;

import com.Proyecto.SpringBoot.Logica.Bomba;
import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Misil;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.TipoElemento;

public class MapearDTO {

    public EscenarioInicialDTO mapearEscenario(List<PortaDron> portaDrones)
    {
        EscenarioInicialDTO escenarioInicial = new EscenarioInicialDTO();

        for (PortaDron portaDron : portaDrones) {
            escenarioInicial.agregarJugador(new JugadorDTO(portaDron.getJugador().getId(), portaDron.getJugador().getNickName(),
                    portaDron.getJugador().getTeam()));

            if (portaDron.getTipo() == TipoElemento.AEREO) {
                PortaDronAereoDTO portaD = new PortaDronAereoDTO(portaDron.getId(), portaDron.getPosicionX(),
                        portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(),
                        portaDron.getEstado().toString(), portaDron.getJugador().getNickName(),
                        portaDron.getJugador().getId(), portaDron.getRangoVision());

                for (Dron dron : portaDron.getDrones()) {
                    DronAereoDTO dronDTO = new DronAereoDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(),
                            dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(),
                            dron.getBateria(),dron.getRangoVision());
                    dronDTO.cargarMunicionesDesdeDron(dron);
                    portaD.agregarDron(dronDTO);
                }

                escenarioInicial.agregarPortaDronAereo(portaD);
            } else if (portaDron.getTipo() == TipoElemento.NAVAL) {
                PortaDronNavalDTO portaD = new PortaDronNavalDTO(portaDron.getId(), portaDron.getPosicionX(),
                        portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(),
                        portaDron.getEstado().toString(), portaDron.getJugador().getNickName(),
                        portaDron.getJugador().getId(), portaDron.getRangoVision());

                for (Dron dron : portaDron.getDrones()) {
                    DronNavalDTO dronDTO = new DronNavalDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(),
                            dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(),
                            dron.getBateria(), dron.getRangoVision());
                    dronDTO.cargarMunicionesDesdeDron(dron);
                    portaD.agregarDron(dronDTO);
                }

                escenarioInicial.agregarPortaDronNaval(portaD);
            }
        }

        return escenarioInicial;
    }

    public CambiosDTO mapearCambios(List<Evento> listaEventos)
    {
        CambiosDTO cambios = new CambiosDTO();


        for (Evento evento : listaEventos) {

            if (evento.getElemento() instanceof Dron) {
                Dron dron = (Dron)evento.getElemento();
                if(dron.getTipo() == TipoElemento.AEREO)
                {

                    DronAereoDTO dDTO = new DronAereoDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(), dron.getPosicionZ(),dron.getAngulo(), dron.getVida(), dron.getEstado().toString(), dron.getBateria(), dron.getRangoVision());
                    dDTO.cargarMunicionesDesdeDron(dron);
                    cambios.insertarElemento(dDTO);
                }else{
                    DronNavalDTO dDTO = new DronNavalDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(), dron.getPosicionZ(),dron.getAngulo(), dron.getVida(), dron.getEstado().toString(), dron.getBateria(), dron.getRangoVision());
                    dDTO.cargarMunicionesDesdeDron(dron);
                    cambios.insertarElemento(dDTO);
                }
            }else if(evento.getElemento() instanceof PortaDron)
            {
                PortaDron pDron = (PortaDron)evento.getElemento();
                if(pDron.getTipo() == TipoElemento.AEREO)
                {

                    PortaDronAereoDTO dDTO = new PortaDronAereoDTO(pDron.getId(), pDron.getPosicionX(), pDron.getPosicionY(), pDron.getPosicionZ(),pDron.getAngulo(), pDron.getVida(), pDron.getEstado().toString(), pDron.getJugador().getNickName(), pDron.getJugador().getId(), pDron.getRangoVision());
                    cambios.insertarElemento(dDTO);
                }else{
                    PortaDronNavalDTO dDTO = new PortaDronNavalDTO(pDron.getId(), pDron.getPosicionX(), pDron.getPosicionY(), pDron.getPosicionZ(),pDron.getAngulo(), pDron.getVida(), pDron.getEstado().toString(), pDron.getJugador().getNickName(), pDron.getJugador().getId(), pDron.getRangoVision());
                    cambios.insertarElemento(dDTO);
                }

            }else if(evento.getElemento() instanceof Misil)
            {
                Misil misil = (Misil)evento.getElemento();
                MisilDTO mDTO = new MisilDTO(misil.getId(), misil.getPosicionX(), misil.getPosicionY(), misil.getPosicionZ(), misil.getAngulo(), misil.getVida(), misil.getEstado().toString(), misil.getVelocidad(), misil.getDistancia());
                cambios.insertarElemento(mDTO);
            }else 
            {
                Bomba bomba = (Bomba)evento.getElemento();
                BombaDTO mDTO = new BombaDTO(bomba.getId(), bomba.getPosicionX(), bomba.getPosicionY(), bomba.getPosicionZ(), bomba.getAngulo(), bomba.getVida(), bomba.getEstado().toString(), bomba.getRadioExplosion(), bomba.isUsada());
                cambios.insertarElemento(mDTO);
            }
            
        }


        return cambios;
    }

}
