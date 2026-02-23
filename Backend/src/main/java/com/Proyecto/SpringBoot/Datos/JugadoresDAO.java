package com.Proyecto.SpringBoot.Datos;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Proyecto.SpringBoot.Modelos.Jugador;

@Repository
public interface JugadoresDAO extends JpaRepository<Jugador, String> {

    Jugador findByNickName(String nickName);

}
