package com.Proyecto.SpringBoot.websocket;

import java.util.Dictionary;
import java.util.Hashtable;
import java.util.List;
import java.util.Queue;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;


import com.Proyecto.SpringBoot.Datos.JugadoresDAO;
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

    private Dictionary<String, Jugador> usuariosConectadosSocket = new Hashtable<>();
    
    private Queue<Jugador> lobbyWaiting = new ConcurrentLinkedQueue<>();
    private Map<String, WebSocketSession> sesionesActivas = new ConcurrentHashMap<>();
    
    @Autowired
    private JugadoresDAO jugadoresDAO;
    
    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Cliente conectado: " + session.getId());
        sesionesActivas.put(session.getId(), session);
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
            session.sendMessage(new TextMessage(response.toString()));
        } else if (tipo.equals("LOGIN_JUGADOR")) {
            response = LoginJugador(session, node);
            session.sendMessage(new TextMessage(response.toString()));
        } else if (tipo.equals("PASAR_LOBBY")) {
            pasarLobby(session, node);
        }
        else {
            System.out.println("Tipo de mensaje no reconocido: " + tipo);
            session.sendMessage(new TextMessage(response.toString()));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Jugador jugador = usuariosConectadosSocket.remove(session.getId());
        sesionesActivas.remove(session.getId());
        if (jugador != null) {
            lobbyWaiting.remove(jugador);
        }

        System.out.println("Cliente desconectado: " + session.getId());
    }

    @Override
    public void enviarAcciones(List<Jugador> jugadores, List<Evento> acciones) {
        throw new UnsupportedOperationException("Metodo en construccion 'enviarAcciones'");
    }

    private void pasarLobby(WebSocketSession session, JsonNode node) throws Exception {
        try {
            
            Jugador jugador = usuariosConectadosSocket.get(session.getId());
            if (jugador == null) {
            
                ObjectNode error = new ObjectMapper().createObjectNode();
                error.put("tipo", "PASAR_LOBBY_FALLIDO");
                error.put("mensaje", "Sesion de jugador no encontrada");
                session.sendMessage(new TextMessage(error.toString()));
                return;
            }

            fachada.pasarALobby(jugador);

            lobbyWaiting.add(jugador);
            
            if (lobbyWaiting.size() >= 2) {

                Jugador jugador1 = lobbyWaiting.poll();
                Jugador jugador2 = lobbyWaiting.poll();
                
                String session1Id = findSessionIdByJugador(jugador1);
                String session2Id = findSessionIdByJugador(jugador2);
                
                if (session1Id != null && session2Id != null) {
                    WebSocketSession wsSession1 = sesionesActivas.get(session1Id);
                    WebSocketSession wsSession2 = sesionesActivas.get(session2Id);
                    
                    if (wsSession1 != null && wsSession1.isOpen()) {
                        ObjectNode startMsg = new ObjectMapper().createObjectNode();
                        startMsg.put("tipo", "PARTIDA_INICIADA");
                        startMsg.put("rival", jugador2.getNickName()); // o debería ser jugador_2?
                        wsSession1.sendMessage(new TextMessage(startMsg.toString()));
                    } else {
                        System.out.println("ERROR - wsSession1 es null o no esta abierto");
                    }
                    
                    if (wsSession2 != null && wsSession2.isOpen()) {
                        ObjectNode startMsg = new ObjectMapper().createObjectNode();
                        startMsg.put("tipo", "PARTIDA_INICIADA");
                        startMsg.put("rival", jugador1.getNickName());
                        wsSession2.sendMessage(new TextMessage(startMsg.toString()));
                    } else {
                        System.out.println("ERROR - wsSession2 es null o no esta abierto");
                    }
                
                } else {
                    System.out.println("ERROR - No se pudieron encontrar ambas sesiones");
                    System.out.println("  Session1Id: " + (session1Id != null ? session1Id : "NULL"));
                    System.out.println("  Session2Id: " + (session2Id != null ? session2Id : "NULL"));
                    ObjectNode error = new ObjectMapper().createObjectNode();
                    error.put("tipo", "PASAR_LOBBY_FALLIDO");
                    error.put("mensaje", "Error al encontrar sesiones de los jugadores");
                    try {
                        if (session1Id != null) sesionesActivas.get(session1Id).sendMessage(new TextMessage(error.toString()));
                        if (session2Id != null) sesionesActivas.get(session2Id).sendMessage(new TextMessage(error.toString()));
                    } catch (Exception ex) {
                        System.err.println("Error al enviar error: " + ex.getMessage());
                    }
                }
            } else {
                ObjectNode response = new ObjectMapper().createObjectNode();
                response.put("tipo", "PASAR_LOBBY_EXITOSO");
                session.sendMessage(new TextMessage(response.toString()));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
            ObjectNode error = new ObjectMapper().createObjectNode();
            error.put("tipo", "PASAR_LOBBY_FALLIDO");
            error.put("mensaje", e.getMessage());
            session.sendMessage(new TextMessage(error.toString()));
        }
    }
    
    private String findSessionIdByJugador(Jugador jugador) {
        
        for (String sessionId : sesionesActivas.keySet()) {
            Jugador j = usuariosConectadosSocket.get(sessionId);
            
            if (j != null && j.getId().equals(jugador.getId())) {
                return sessionId;
            }
        }
        System.out.println("No se encontro sesion para jugador " + jugador.getNickName());
        return null;
    }

    private ObjectNode RegistrarJugador(WebSocketSession session, JsonNode node) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode response = mapper.createObjectNode();

        String nickname = null;
        if (node.has("nickname") && !node.get("nickname").isNull()) {
            nickname = node.get("nickname").asText().trim();
        }

        if (nickname == null || nickname.isEmpty()) {
            response.put("tipo", "REGISTRO_FALLIDO");
            response.put("mensaje", "Nickname requerido");
            return response;
        }

        try {
        	Jugador existente = null;
        	if (jugadoresDAO != null) {
        	    existente = jugadoresDAO.findByNickName(nickname);
        	}
            if (existente != null) {
                response.put("tipo", "REGISTRO_FALLIDO");
                response.put("mensaje", "El apodo " + nickname + " ya existe.");
                return response;
            }

            Jugador nuevoJugador = fachada.crearUsuario(nickname, null);
            usuariosConectadosSocket.put(session.getId(), nuevoJugador);
            System.out.println("REGISTRO Jugador registrado: " + nickname + " | Session ID: " + session.getId() + " | Usuarios en map: " + usuariosConectadosSocket.size());

            response.put("tipo", "JUGADOR_CREADO");
            response.put("id", nuevoJugador.getId());
            response.put("nickname", nuevoJugador.getNickName());
        } catch (ExisteNickNameException e) {
            response.put("tipo", "REGISTRO_FALLIDO");
            response.put("mensaje", e.getMessage());
        } catch (Exception e) {
            System.err.println("Excepcion inesperada al registrar jugador: " + e);
            response.put("tipo", "ERROR");
            response.put("mensaje", "Error interno: " + e.getMessage());
        }

        return response;
    }

    private ObjectNode LoginJugador(WebSocketSession session, JsonNode node) {
        String nickname = null;
        if (node.has("nickname") && !node.get("nickname").isNull()) {
            nickname = node.get("nickname").asText().trim();
        }

        if (nickname == null || nickname.isEmpty()) {
            ObjectNode response = new ObjectMapper().createObjectNode();
            response.put("tipo", "LOGIN_FALLIDO");
            response.put("mensaje", "Nickname requerido");
            return response;
        }

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode response = mapper.createObjectNode();

        Jugador jugador = null;
        try {
            jugador = fachada.loginUsuario(nickname);

            usuariosConectadosSocket.put(session.getId(), jugador);

            response.put("tipo", "LOGIN_EXITOSO");
            response.put("id", jugador.getId());
            response.put("nickname", jugador.getNickName());
        } catch (Exception e) {
            System.err.println("LOGIN Error al hacer login: " + e.getMessage());
            response.put("tipo", "LOGIN_FALLIDO");
            response.put("mensaje", "Nickname no encontrado");
        }

        return response;
    }

}
