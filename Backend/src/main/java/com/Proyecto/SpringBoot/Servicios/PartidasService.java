package com.Proyecto.SpringBoot.Servicios;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.MapeoSesion;
import com.Proyecto.SpringBoot.Datos.DAO.SesionDAO;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadSesion;
import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Evento_DesplegarDron;
import com.Proyecto.SpringBoot.Logica.Evento_Disparo;
import com.Proyecto.SpringBoot.Logica.Evento_Movimiento;
import com.Proyecto.SpringBoot.Logica.Evento_Recarga;
import com.Proyecto.SpringBoot.Logica.Mapa;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.SesionJuego;
import com.Proyecto.SpringBoot.Logica.iFachada;
import com.Proyecto.SpringBoot.Logica.iPartidaService;
import com.Proyecto.SpringBoot.Logica.Excepciones.AccionInvalidaException;
import com.Proyecto.SpringBoot.Logica.Excepciones.PartidaException;

@Service
public class PartidasService implements iPartidaService{

    public boolean accion_recargar(EntidadJugador jugador, int idDron) throws AccionInvalidaException {
        boolean actualizado = false;
        if (validar_accion(jugador)) {
            String sesionId = jugadorEnSesion.get(jugador.getId());
            SesionJuego sesion = sesionesActivas.get(sesionId);
            if (sesion != null) {
                Evento_Recarga er = new Evento_Recarga();
                er.setElemento(sesion.getElemento(idDron));
                er.habilitar();
                actualizado = sesion.agregarEvento(er);
            }
        }
        return actualizado;
    }

    // Dado un id de usuario, se obtiene la sesion en la que esta el jugador.
    Map<String, String> jugadorEnSesion;

    // Dado el id de una sesion, se obtiene la sesion de juego.
    Map<String, SesionJuego> sesionesActivas;

    @Autowired
    SesionDAO sesionDAO;

    @Autowired
    JugadoresService jugadores;

    private iFachada fachada;

    @Autowired
    public PartidasService() {
        jugadorEnSesion = new java.util.Hashtable<>();
        sesionesActivas = new java.util.Hashtable<>();
    }

    public void setiFachada(iFachada fachada) {
        this.fachada = fachada;
    }

    public boolean existePartidaByJugador(EntidadJugador jugador)
    {
        return sesionDAO.findByJugadorPrincipal(jugador) != null;
    }

     public void desconectarJugador(EntidadJugador jugador) throws Exception {

        if (jugadorEnSesion.containsKey(jugador.getId())) {
            String idSesion = jugadorEnSesion.get(jugador.getId());
            sesionesActivas.get(idSesion).jugadorDesconectado(jugador);
            jugadorEnSesion.remove(jugador.getId());
        }

    }

    public int getSesionesActivas() {
        return sesionesActivas.size();
    }

    public boolean crearSesion(List<EntidadJugador> listaJugadores) {
        String idSesion = "Sesion-" + System.currentTimeMillis();
        for (EntidadJugador entidadJugador : listaJugadores) {
            jugadorEnSesion.put(entidadJugador.getId(), idSesion);
        }

        SesionJuego nuevaSesion = new SesionJuego(idSesion, listaJugadores, this);
        sesionesActivas.put(nuevaSesion.getIdSesion(), nuevaSesion);
        nuevaSesion.iniciarSesion();

        return true;
    }

  public boolean recuperarPartida(EntidadJugador jugador) throws PartidaException {

        // Recupero la partida guardada del jugador
        EntidadSesion entidad = sesionDAO.findByJugadorPrincipal(jugador);
        if (entidad == null) {
            throw new PartidaException("El jugador no tiene partidas guardadas.");
        }

        boolean estanTodos = true;
        int i = 0;

        List<EntidadJugador> lista = new ArrayList<>();

        while (i < entidad.getListaJugadores().size() && estanTodos) {
            // Se obtiene si el jugador esta conectado y no esta en ninguna sesion de juego
            EntidadJugador jAux = jugadores.obtenerJugadorConectado(entidad.getListaJugadores().get(i).getId());
            if (jAux != null && jugadorEnSesion.get(jAux.getId()) == null) {
                lista.add(jAux);
            } else {
                estanTodos = false;
            }
            i++;
        }

        if (estanTodos) {
            for (EntidadJugador entidadJugador : lista) {
                jugadorEnSesion.put(entidadJugador.getId(), entidad.getIdSesion());
            }

            SesionJuego sesion = new SesionJuego(entidad.getIdSesion(), entidad.getListaJugadores(), this);
            sesionesActivas.put(entidad.getIdSesion(), sesion);
            List<PortaDron> listaPdron = new MapeoSesion().mapearEntidadSesion(entidad);
            sesion.recuperarPartidda(listaPdron);

        } else {
            throw new PartidaException("No se encuentran todos los jugadores conectados para iniciar la partida");
        }

        return true;
    }

    public boolean guardarPartida(EntidadJugador jugador) {
        MapeoSesion mpSesion = new MapeoSesion();

        String idSes = jugadorEnSesion.get(jugador.getId());
        SesionJuego sJuego = sesionesActivas.get(idSes);
        EntidadSesion eSesion = mpSesion.mapearSesionJuego(sJuego, jugador);

        sesionDAO.save(eSesion);

        return true;
    }

    private boolean validar_accion(EntidadJugador jugador) throws AccionInvalidaException {
        String sesionId = jugadorEnSesion.get(jugador.getId());

        if (sesionId == null) {
            throw new AccionInvalidaException("El jugador no esta en una sesion activa.");
        }

        SesionJuego sesion = sesionesActivas.get(sesionId);
        if (sesion == null) {
            throw new AccionInvalidaException("La sesion de juego no existe.");
        }

        return true;
    }

    public boolean accion_mover(EntidadJugador jugador, int idElemento, float x, float y, float z, int angulo)
            throws AccionInvalidaException {

        boolean actualizado = false;
        if (validar_accion(jugador)) {
            String sesionId = jugadorEnSesion.get(jugador.getId());
            SesionJuego sesion = sesionesActivas.get(sesionId);

            Evento_Movimiento em = new Evento_Movimiento();
            em.setElemento(sesion.getElemento(idElemento));
            em.setNuevaPosX(x);
            em.setNuevaPosY(y);
            em.setNuevoAngulo(angulo);

            actualizado = sesion.agregarEvento(em);
        }
        return actualizado;
    }

    public boolean accion_desplegar(EntidadJugador jugador, int idPortaDron) throws AccionInvalidaException {

        boolean actualizado = false;
        if (validar_accion(jugador)) {
            String sesionId = jugadorEnSesion.get(jugador.getId());
            SesionJuego sesion = sesionesActivas.get(sesionId);

            Evento_DesplegarDron em = new Evento_DesplegarDron();
            em.setElemento(sesion.getElemento(idPortaDron));
            actualizado = sesion.agregarEvento(em);
        }

        return actualizado;
        
    }

    public boolean accion_disparar(EntidadJugador jugador, int idElemento) throws AccionInvalidaException {
        
        boolean actualizado = false;
        if (validar_accion(jugador)) {
            String sesionId = jugadorEnSesion.get(jugador.getId());
            SesionJuego sesion = sesionesActivas.get(sesionId);

            Evento_Disparo em = new Evento_Disparo(sesion.getElemento(idElemento));
           
            actualizado = sesion.agregarEvento(em);
        }
        return actualizado;
        
    }

    @Override
    public boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones) {
       return fachada.EnviarActualizaciones(jugadores, acciones);
    }

    @Override
    public boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa) {
        return fachada.EnviarInicioPartida(portaDrones, mapa);
    }

    @Override
    public void EnviarFinPartida(List<EntidadJugador> jugadores, EntidadJugador ganador) {
        fachada.EnviarFinPartida(jugadores, ganador);
    }
}
