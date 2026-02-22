package com.Proyecto.SpringBoot.Logica.Excepciones;

public class ExisteNickNameException extends RuntimeException {
    public ExisteNickNameException(String message) {
        super(message);
    }

}
