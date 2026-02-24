package com.Proyecto.SpringBoot.websocket;

import java.io.IOException;
import java.util.Dictionary;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Fachada;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.iHandler;
import com.Proyecto.SpringBoot.Logica.Excepciones.ExisteNickNameException;
import com.Proyecto.SpringBoot.Logica.Excepciones.LobbyException;
import com.Proyecto.SpringBoot.Modelos.Jugador;

import jakarta.annotation.PostConstruct;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler implements iHandler {

    @Autowired
    Fachada fachada;

    Dictionary<WebSocketSession, Jugador> usuariosConectadosbySocket;
    Dictionary<String, WebSocketSession> usuariosConectadosbyIdJugador;

    @PostConstruct
    public void init() {
        fachada.setHandler(this);
        usuariosConectadosbySocket = new java.util.Hashtable<>();
        usuariosConectadosbyIdJugador = new java.util.Hashtable<>();
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Cliente conectado: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        JsonNode node = null;

        try {
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

        if (tipo == null) {
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
            if (usuariosConectadosbySocket.get(session) == null) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "El jugador no ha iniciado sesión.");
                session.sendMessage(new TextMessage(response.toString()));
                return;
            }
            response = pasarLobby(session, node);
        } else if (tipo.equals("MOVER_ELEMENTO")) {
            if (usuariosConectadosbySocket.get(session) == null) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "El jugador no ha iniciado sesión.");
                session.sendMessage(new TextMessage(response.toString()));
                return;
            }
            response = procesarMovimiento(session, node);
        }else if (tipo.equals("DISPARAR_BOMBA")) {
            if (usuariosConectadosbySocket.get(session) == null) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "El jugador no ha iniciado sesión.");
                session.sendMessage(new TextMessage(response.toString()));
                return;
            }
            response = procesarDisparo(session, node);
        } else {
            System.out.println("Tipo de mensaje no reconocido: " + tipo);
        }
        session.sendMessage(new TextMessage(response.toString()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        usuariosConectadosbySocket.remove(session);
        usuariosConectadosbyIdJugador.remove(usuariosConectadosbySocket.get(session));
        fachada.desconectarUsuario(usuariosConectadosbySocket.get(session).getId());

        System.out.println("Cliente desconectado: " + session.getId());
    }

    @Override
    public boolean enviarAcciones(List<Jugador> jugadores, List<Evento> acciones) {
        throw new UnsupportedOperationException("Unimplemented method 'enviarAcciones'");
    }

    private ObjectNode procesarDisparo(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        try {
            int idElemento = node.get("idElemento").asInt();

            boolean resultado = fachada.accion_disparar(usuariosConectadosbySocket.get(session), idElemento);

            if (resultado) {
                response.put("tipo", "DISPARO_PROCESADO");
            } else {
                response.put("tipo", "DISPARO_FALLIDO");
                response.put("mensaje", "No se pudo procesar el disparo.");
            }
        } catch (Exception e) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "Error al procesar el disparo: " + e.getMessage());
        }

        return response;
    }

    private ObjectNode procesarMovimiento(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        try {
            int idElemento = node.get("idElemento").asInt();
            float x = node.get("PosicionX").floatValue();
            float y = node.get("PosicionY").floatValue();
            float z = node.get("PosicionZ").floatValue();
            int angulo = node.get("Angulo").asInt();

            boolean resultado = fachada.accion_mover(usuariosConectadosbySocket.get(session), idElemento, x, y, z, angulo);

            if (resultado) {
                response.put("tipo", "MOVIMIENTO_PROCESADO");
            } else {
                response.put("tipo", "MOVIMIENTO_FALLIDO");
                response.put("mensaje", "No se pudo procesar el movimiento.");
            }
        } catch (Exception e) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "Error al procesar el movimiento: " + e.getMessage());
        }

        return response;
    }

    private ObjectNode pasarLobby(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        try {
            fachada.pasarALobby(usuariosConectadosbySocket.get(session));
            response.put("tipo", "PASAR_LOBBY_EXITOSO");
        } catch (LobbyException e) {
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
            usuariosConectadosbySocket.put(session, nuevoJugador);
            usuariosConectadosbyIdJugador.put(nuevoJugador.getId(), session);
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

            usuariosConectadosbySocket.put(session, jugador);
            usuariosConectadosbyIdJugador.put(jugador.getId(), session);
            System.err.println("Jugador " + jugador.getNickName() + " ha iniciado sesión con ID: " + jugador.getId());

            response.put("tipo", "LOGIN_EXITOSO");
            response.put("id", jugador.getId());
            response.put("nickname", jugador.getNickName());
        } catch (Exception JugadorNoExisteException) {

            response.put("tipo", "LOGIN_FALLIDO");
            response.put("mensaje", "Nickname no encontrado");

        }

        return response;

    }

    @Override
    public boolean enviarInicioPartida(List<PortaDron> portaDrones) {

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode sobre = mapper.createObjectNode();
        JsonNode datos = mapper.valueToTree(portaDrones);
        sobre.put("tipo", "PARTIDA_INICIADA");
        sobre.set("datos", datos);
        String jsonFinal = mapper.writeValueAsString(sobre);

        for (PortaDron portaDron : portaDrones) {
            try {
                WebSocketSession session = usuariosConectadosbyIdJugador.get(portaDron.getJugador().getId());
                session.sendMessage(new TextMessage(jsonFinal));
                //usuariosConectadosbyIdJugador.get(portaDron.getJugador().getId()).sendMessage(new TextMessage(jsonFinal));
            } catch (IOException e) {
                System.err.println("Error al enviar mensaje al jugador: " + e.getMessage());
            }
        }

        

        return true;
    }

}