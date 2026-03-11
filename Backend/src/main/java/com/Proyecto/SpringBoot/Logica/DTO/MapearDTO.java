package com.Proyecto.SpringBoot.Logica.DTO;

import java.util.List;

import com.Proyecto.SpringBoot.Logica.Bomba;
import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Evento_ActualizaEstado;
import com.Proyecto.SpringBoot.Logica.Evento_Movimiento;
import com.Proyecto.SpringBoot.Logica.Evento_RecibeImpacto;
import com.Proyecto.SpringBoot.Logica.Misil;
import com.Proyecto.SpringBoot.Logica.Municion;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.TipoElemento;

public class MapearDTO {

    public EscenarioInicialDTO mapearEscenario(List<PortaDron> portaDrones) {
        EscenarioInicialDTO escenarioInicial = new EscenarioInicialDTO();

        for (PortaDron portaDron : portaDrones) {
            escenarioInicial
                    .agregarJugador(new JugadorDTO(portaDron.getJugador().getId(), portaDron.getJugador().getNickName(),
                            portaDron.getJugador().getTeam()));

            if (portaDron.getTipo() == TipoElemento.AEREO) {
                PortaDronAereoDTO portaD = new PortaDronAereoDTO(portaDron.getId(), portaDron.getPosicionX(),
                        portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(),
                        portaDron.getEstado().toString(), portaDron.getJugador().getNickName(),
                        portaDron.getJugador().getId());

                for (Dron dron : portaDron.getDrones()) {
                    DronAereoDTO dronDTO = new DronAereoDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(),
                            dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(),
                            dron.getBateria(), dron.getRangoVision());
                    dronDTO.cargarMunicionesDesdeDron(dron);
                    portaD.agregarDron(dronDTO);
                }

                escenarioInicial.agregarPortaDronAereo(portaD);
            } else if (portaDron.getTipo() == TipoElemento.NAVAL) {
                PortaDronNavalDTO portaD = new PortaDronNavalDTO(portaDron.getId(), portaDron.getPosicionX(),
                        portaDron.getPosicionY(), portaDron.getPosicionZ(), portaDron.getAngulo(), portaDron.getVida(),
                        portaDron.getEstado().toString(), portaDron.getJugador().getNickName(),
                        portaDron.getJugador().getId());

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

    private DronAereoDTO parsearDronAereo(Dron dron) {

        DronAereoDTO dDTO = new DronAereoDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(),
                dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(),
                dron.getBateria(), dron.getRangoVision());
        for (Municion municion : dron.getMuniciones()) {
            if (!municion.isUsada()) {
                Bomba bomba = (Bomba) municion;
                dDTO.agregarBomba(pasearBomba(bomba));
            }
        }

        return dDTO;
    }

    private DronNavalDTO parsearDronNaval(Dron dron) {
        DronNavalDTO dDTO = new DronNavalDTO(dron.getId(), dron.getPosicionX(), dron.getPosicionY(),
                dron.getPosicionZ(), dron.getAngulo(), dron.getVida(), dron.getEstado().toString(),
                dron.getBateria(), dron.getRangoVision());

        for (Municion municion : dron.getMuniciones()) {
            if (!municion.isUsada()) {
                Misil misil = (Misil) municion;
                dDTO.agregarMisil(parsearMisil(misil));
            }
        }

        return dDTO;

    }

    private PortaDronAereoDTO parsearPortaDronAereo(PortaDron pDron) {
        PortaDronAereoDTO dDTO = new PortaDronAereoDTO(pDron.getId(), pDron.getPosicionX(),
                pDron.getPosicionY(), pDron.getPosicionZ(), pDron.getAngulo(), pDron.getVida(),
                pDron.getEstado().toString(), pDron.getJugador().getNickName(),
                pDron.getJugador().getId());

        return dDTO;

    }

    private PortaDronNavalDTO parsearPortaDronNaval(PortaDron pDron) {
        PortaDronNavalDTO dDTO = new PortaDronNavalDTO(pDron.getId(), pDron.getPosicionX(),
                pDron.getPosicionY(), pDron.getPosicionZ(), pDron.getAngulo(), pDron.getVida(),
                pDron.getEstado().toString(), pDron.getJugador().getNickName(),
                pDron.getJugador().getId());

        return dDTO;

    }

    private MisilDTO parsearMisil(Misil misil) {
        MisilDTO mDTO = new MisilDTO(misil.getId(), misil.getPosicionX(), misil.getPosicionY(),
                misil.getPosicionZ(), misil.getAngulo(), misil.getVida(), misil.getEstado(),
                misil.getVelocidad(), misil.getDistancia());

        return mDTO;

    }

    private BombaDTO pasearBomba(Bomba bomba) {
        BombaDTO mDTO = new BombaDTO(bomba.getId(), bomba.getPosicionX(), bomba.getPosicionY(),
                bomba.getPosicionZ(), bomba.getAngulo(), bomba.getVida(), bomba.getEstado().toString(),
                bomba.getRadioExplosion(), bomba.isUsada());
        return mDTO;

    }

    public CambiosDTO mapearCambios(List<Evento> listaEventos) {
        CambiosDTO cambios = new CambiosDTO();

        for (Evento evento : listaEventos) {

            if (evento instanceof Evento_ActualizaEstado) {

                if (evento.getElemento() instanceof Dron) {
                    Dron dron = (Dron) evento.getElemento();
                    if (dron.getTipo() == TipoElemento.AEREO) {
                        cambios.insertarElemento(parsearDronAereo(dron));
                    } else {
                        cambios.insertarElemento(parsearDronNaval(dron));
                    }
                } else if (evento.getElemento() instanceof PortaDron) {
                    PortaDron pDron = (PortaDron) evento.getElemento();
                    if (pDron.getTipo() == TipoElemento.AEREO) {
                        cambios.insertarElemento(parsearPortaDronAereo(pDron));
                    } else {
                        cambios.insertarElemento(parsearPortaDronNaval(pDron));
                    }

                } else if (evento.getElemento() instanceof Misil) {
                    Misil misil = (Misil) evento.getElemento();
                    cambios.insertarElemento(parsearMisil(misil));
                } else {
                    Bomba bomba = (Bomba) evento.getElemento();
                    cambios.insertarElemento(pasearBomba(bomba));
                }
            } else if (evento instanceof Evento_RecibeImpacto) {
                Evento_RecibeImpacto rev = (Evento_RecibeImpacto) evento;
                String tipoProyectil = "Bomba";
                String clase = "Dron";

                if (rev.getIdElementoEmisor() instanceof Misil) {
                    tipoProyectil = "Misil";
                }
                if (rev.getElemento() instanceof PortaDron) {
                    clase = "Portadron";
                }

                RecibeImpactoDTO recibeImpacto = new RecibeImpactoDTO(rev.getIdElemento(), tipoProyectil, clase);
                cambios.insertarEvento(recibeImpacto);
            }

        }

        return cambios;
    }

}
