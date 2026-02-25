package com.Proyecto.SpringBoot.Logica.Excepciones;

public class AccionInvalidaException extends RuntimeException {
    public AccionInvalidaException(String mensaje) {
        super(mensaje);
    }

}
