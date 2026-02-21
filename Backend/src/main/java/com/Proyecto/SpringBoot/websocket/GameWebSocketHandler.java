package com.Proyecto.SpringBoot.websocket;

import java.util.Dictionary;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Fachada;
import com.Proyecto.SpringBoot.Logica.iHandler;
import com.Proyecto.SpringBoot.Modelos.Jugador;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler implements iHandler {

    @Autowired
    Fachada fachada;

    @Autowired
    Dictionary<String, Jugador> jugadoresActivos;

    


    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Cliente conectado: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

        System.out.println("Recibido: " + message.getPayload() + " de cliente: " + session.getId());

        session.sendMessage(new TextMessage("Servidor recibio: " + message.getPayload()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out.println("Cliente desconectado: " + session.getId());
    }

    @Override
    public void enviarAcciones(List<Jugador> jugadores, List<Evento> acciones) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'enviarAcciones'");
    }
}