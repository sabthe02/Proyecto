package com.Proyecto.SpringBoot.websocket;

import java.util.Dictionary;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.Proyecto.SpringBoot.Datos.JugadoresDAO;
import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Fachada;
import com.Proyecto.SpringBoot.Logica.iHandler;
import com.Proyecto.SpringBoot.Modelos.Jugador;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler implements iHandler {

    @Autowired
    Fachada fachada;

    @Autowired
    private JugadoresDAO jugadoresDAO;


    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Cliente conectado: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = mapper.readTree(message.getPayload());

        String tipo = node.get("tipo").asText();

        if (tipo.equals("REGISTRAR_JUGADOR")) {

            String nickname = node.get("nickname").asText();

            Jugador jugador = new Jugador(
                    UUID.randomUUID().toString(),
                    nickname,
                    "naval"
            );

            jugadoresDAO.save(jugador);  // ✅ CORRECT

            ObjectNode response = mapper.createObjectNode();
            response.put("tipo", "JUGADOR_REGISTRADO");
            response.put("id", jugador.getId());
            response.put("nickname", jugador.getNickName());

            session.sendMessage(new TextMessage(response.toString()));
        }
    }
    
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out.println("Cliente desconectado: " + session.getId());
    }

    @Override
    public void enviarAcciones(List<Jugador> jugadores, List<Evento> acciones) {
        throw new UnsupportedOperationException("Unimplemented method 'enviarAcciones'");
    }
    
}
    