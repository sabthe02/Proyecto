package com.Proyecto.SpringBoot.Datos.DAO;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;

@Repository
public interface JugadoresDAO extends JpaRepository<EntidadJugador, String> {

    EntidadJugador findByNickName(String nickName);



}
