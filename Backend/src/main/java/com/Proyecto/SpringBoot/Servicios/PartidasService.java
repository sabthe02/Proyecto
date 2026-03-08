package com.Proyecto.SpringBoot.Servicios;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.Proyecto.SpringBoot.Datos.MapeoSesion;
import com.Proyecto.SpringBoot.Datos.DAO.SesionDAO;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadSesion;
import com.Proyecto.SpringBoot.Logica.Bomba;
import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Elemento;
import com.Proyecto.SpringBoot.Logica.EstadoElemento;
import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Evento_DesplegarDron;
import com.Proyecto.SpringBoot.Logica.Evento_Disparo;
import com.Proyecto.SpringBoot.Logica.Evento_Movimiento;
import com.Proyecto.SpringBoot.Logica.Mapa;
import com.Proyecto.SpringBoot.Logica.Misil;
import com.Proyecto.SpringBoot.Logica.Municion;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.SesionJuego;
import com.Proyecto.SpringBoot.Logica.iFachada;
import com.Proyecto.SpringBoot.Logica.iPartidaService;
import com.Proyecto.SpringBoot.Logica.Excepciones.AccionInvalidaException;

@Service
public class PartidasService implements iPartidaService{

    // Dado un id de usuario, se obtiene la sesion en la que esta el jugador.
    Map<String, String> jugadorEnSesion;

    // Dado el id de una sesion, se obtiene la sesion de juego.
    Map<String, SesionJuego> sesionesActivas;

    @Autowired
    SesionDAO sesionDAO;

    @Autowired
    JugadoresService jugadores;

    private iFachada fachada;

    public PartidasService() {
        jugadorEnSesion = new java.util.Hashtable<>();
        sesionesActivas = new java.util.Hashtable<>();
    }

    public void setiFachada(iFachada fachada) {
        this.fachada = fachada;
    }

    public boolean desconectarJugador(EntidadJugador jugador) throws Exception {
        throw new Exception("Metodo no implementado");

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

    public boolean recuperarPartida(EntidadJugador jugador) {

        // recupero todas las partidas del usuario
        List<EntidadSesion> listaSesiones = sesionDAO.buscarSesionesPorNombreJugador(jugador.getNickName());
        EntidadSesion entidad = null;

        // si encuentro una partida que tenga todos los usuarios conectados (sin estar
        // en el lobby), se inicia automaticamente
        boolean encontre = false;
        int i = 0;
        while (!encontre && i < listaSesiones.size()) {
            entidad = listaSesiones.get(i);

            boolean estan = true;
            int j = 0;

            while (estan && j < entidad.getListaJugadores().size()) {
                //estan = usuariosConectados.get(entidad.getListaJugadores().get(j).getId()) != null;
            }

            if (j < entidad.getListaJugadores().size()) {
                encontre = true;
            }
        }

        if (encontre) {
            SesionJuego sesion = new MapeoSesion().mapearEntidadSesion(entidad);

        }

        return true;
    }

    public boolean guardarPartida(EntidadJugador jugador) {
        MapeoSesion mpSesion = new MapeoSesion();

        String idSes = jugadorEnSesion.get(jugador.getId());
        SesionJuego sJuego = sesionesActivas.get(idSes);
        EntidadSesion eSesion = mpSesion.mapearSesionJuego(sJuego);

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
    public void EnviarFinPartida(String ganador) {
        fachada.EnviarFinPartida(ganador);
    }
}
