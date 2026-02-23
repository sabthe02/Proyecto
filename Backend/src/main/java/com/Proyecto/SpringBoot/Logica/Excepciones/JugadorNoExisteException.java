package com.Proyecto.SpringBoot.Logica.Excepciones;

public class JugadorNoExisteException extends RuntimeException {
    public JugadorNoExisteException(String message) {
        super(message);
    }

}
