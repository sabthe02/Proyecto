package com.Proyecto.SpringBoot.Datos.DAO;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Datos.Entidades.EntidadSesion;


@Repository
public interface SesionDAO extends JpaRepository<EntidadSesion, String>{

    EntidadSesion findByIdSesion(String idSesion);

    
    //List<EntidadSesion> findAllByListaJugadoresContaining(EntidadJugador jugador);

    @Query("SELECT s FROM EntidadSesion s JOIN s.listaJugadores j WHERE j.nickName = :nombre")
    List<EntidadSesion> buscarSesionesPorNombreJugador(@Param("nombre") String nombre);


}
