package com.Proyecto.SpringBoot.Datos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.Proyecto.SpringBoot.Datos.DAO.JugadoresDAO;
import com.Proyecto.SpringBoot.Datos.DAO.SesionDAO;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadDron;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadPortadron;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadSesion;
import com.Proyecto.SpringBoot.Logica.EstadoElemento;
import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Fachada;
import com.Proyecto.SpringBoot.Logica.Mapa;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.SesionJuego;
import com.Proyecto.SpringBoot.Logica.TipoElemento;
import com.Proyecto.SpringBoot.Logica.iPartidaService;

import jakarta.transaction.Transactional;

@SpringBootTest
@Transactional
public class Integracion_DatosTest {

    @Autowired
    SesionDAO sesionDAO;

    @Autowired
    JugadoresDAO jugadorDAO;

    @Test
    void constructor_setearCampos() {
        List<EntidadDron> lista = new ArrayList<>();
        EntidadSesion entidad = new EntidadSesion("idSes");
        EntidadPortadron pDron = new EntidadPortadron(
                0,
                1f,
                1f,
                1f,
                0,
                0,
                EstadoElemento.ACTIVO,
                TipoElemento.AEREO,
                lista,
                new EntidadJugador( "NickName", "Team"));

        entidad.agregarPortaDron(pDron);
        assertEquals(1f, pDron.getPosicionX());
        assertEquals(1, entidad.getCandidadPortaDron());
    }

    @Test
    void guardar_sesion() {

        EntidadJugador j1 = new EntidadJugador("jugadorTest1", "");
        EntidadJugador j2 = new EntidadJugador( "jugadorTest2", "");
        

        jugadorDAO.save(j1);
        jugadorDAO.save(j2);

        List<EntidadJugador> jugadores = new ArrayList<>();
        jugadores.add(j1);
        jugadores.add(j2);
        
        SesionJuego sJ = new SesionJuego("idSesionTest", jugadores, new iPartidaService() {

            @Override
            public boolean EnviarActualizaciones(List<EntidadJugador> jugadores, List<Evento> acciones) {
                
                return true;
            }

            @Override
            public boolean EnviarInicioPartida(List<PortaDron> portaDrones, Mapa mapa) {
                assertEquals(2, portaDrones.size());

                return true;
            }

            @Override
            public void EnviarFinPartida(List<EntidadJugador> jugadores, EntidadJugador ganador, String mensaje) {
               
            }
            
        });
        sJ.iniciarSesion();


        EntidadSesion entidad = new MapeoSesion().mapearSesionJuego(sJ, j1);

        sesionDAO.save(entidad);

        EntidadSesion entidadRecuperada = sesionDAO.findByIdSesion(entidad.getIdSesion());
        assertNotNull(entidadRecuperada);
        assertEquals("idSesionTest", entidadRecuperada.getIdSesion());

        List<EntidadSesion> listaEntidades = sesionDAO.buscarSesionesPorNombreJugador(j1.getNickName());
        assertNotNull(listaEntidades);
        assertEquals(1, listaEntidades.size());

    }
}
