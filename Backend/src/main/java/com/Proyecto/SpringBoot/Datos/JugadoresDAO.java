package com.Proyecto.SpringBoot.Datos;

import com.Proyecto.SpringBoot.Modelos.Jugador;

public class JugadoresDAO {

    public JugadoresDAO() {
    }

    
    public void agregarJugador(String nickName, String team) {


    }

    
    public Jugador obtenerJugador(String nickName) {
       
        return new Jugador(nickName, nickName, nickName); 
    }

}
