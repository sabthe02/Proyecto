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
import com.Proyecto.SpringBoot.Logica.Excepciones.ExisteNickNameException;
import com.Proyecto.SpringBoot.Modelos.Jugador;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler implements iHandler {

    @Autowired
    Fachada fachada;

    @Autowired
    Dictionary<String, Jugador> usuariosConectadosSocket;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Cliente conectado: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = null;

        try{
             node = mapper.readTree(message.getPayload());
        } catch (Exception e) {
            ObjectNode response = new ObjectMapper().createObjectNode();
            response.put("tipo", "ERROR");
            response.put("mensaje", "El mensaje no es un JSON válido.");
            response.put("mensaje_recibido", message.getPayload());
            session.sendMessage(new TextMessage(response.toString()));
            return;
        }
        

        ObjectNode response = new ObjectMapper().createObjectNode();

        String tipo = node.get("tipo").asString();
        
        if(tipo == null) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "El mensaje no contiene un campo 'tipo' válido.");
            session.sendMessage(new TextMessage(response.toString()));
            return;
        }

        if (tipo.equals("REGISTRAR_JUGADOR")) {
            response = RegistrarJugador(session, node);
        } else if (tipo.equals("LOGIN_JUGADOR")) {
            response = LoginJugador(session, node);
        } else if (tipo.equals("PASAR_LOBBY")) {
            response = pasarLobby(session, node);            
        }
        else {
            System.out.println("Tipo de mensaje no reconocido: " + tipo);
        }
        session.sendMessage(new TextMessage(response.toString()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        usuariosConectadosSocket.remove(session.getId());

        System.out.println("Cliente desconectado: " + session.getId());
    }

    @Override
    public void enviarAcciones(List<Jugador> jugadores, List<Evento> acciones) {
        throw new UnsupportedOperationException("Unimplemented method 'enviarAcciones'");
    }

    private ObjectNode pasarLobby(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        try {
            fachada.pasarALobby(usuariosConectadosSocket.get(session.getId()));
            response.put("tipo", "PASAR_LOBBY_EXITOSO");
        } catch (Exception e) {

            response.put("tipo", "PASAR_LOBBY_FALLIDO");
            response.put("mensaje", e.getMessage());
            return response;
        }

        return response;
    }

    private ObjectNode RegistrarJugador(WebSocketSession session, JsonNode node) throws Exception {
        String nickname = node.get("nickname").asString();
        String team = node.get("team").asString();
        ObjectNode response = new ObjectMapper().createObjectNode();

        Jugador nuevoJugador = null;

        try {
            nuevoJugador = fachada.crearUsuario(nickname, team);
            usuariosConectadosSocket.put(session.getId(), nuevoJugador);
            response.put("tipo", "JUGADOR_CREADO");
            response.put("id", nuevoJugador.getId());
            response.put("nickname", nuevoJugador.getNickName());
        } catch (ExisteNickNameException e) {
            response.put("tipo", "REGISTRO_FALLIDO");
            response.put("mensaje", e.getMessage());
        }

        return response;
    }

    private ObjectNode LoginJugador(WebSocketSession session, JsonNode node) throws Exception {
        String nickname = node.get("nickname").asString();

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode response = mapper.createObjectNode();

        Jugador jugador = null;
        try {
            jugador = fachada.loginUsuario(nickname);

            if(usuariosConectadosSocket.get(jugador.getId()) != null)
            {
                usuariosConectadosSocket.remove(jugador.getId());
            }

            usuariosConectadosSocket.put(session.getId(), jugador);

            response.put("tipo", "LOGIN_EXITOSO");
            response.put("id", jugador.getId());
            response.put("nickname", jugador.getNickName());
        } catch (Exception JugadorNoExisteException) {

            response.put("tipo", "LOGIN_FALLIDO");
            response.put("mensaje", "Nickname no encontrado");

        }

        return response;

    }

}