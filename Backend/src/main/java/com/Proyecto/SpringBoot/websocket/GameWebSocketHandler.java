package com.Proyecto.SpringBoot.websocket;

import java.io.IOException;
import java.util.Dictionary;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;


import com.Proyecto.SpringBoot.Datos.Entidades.EntidadJugador;
import com.Proyecto.SpringBoot.Logica.Fachada;
import com.Proyecto.SpringBoot.Logica.iHandler;
import com.Proyecto.SpringBoot.Logica.DTO.CambiosDTO;
import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;
import com.Proyecto.SpringBoot.Logica.DTO.JugadorDTO;
import com.Proyecto.SpringBoot.Logica.DTO.LoginUsuarioDTO;
import com.Proyecto.SpringBoot.Logica.Excepciones.ExisteNickNameException;
import com.Proyecto.SpringBoot.Logica.Excepciones.LobbyException;

import jakarta.annotation.PostConstruct;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@Component
public class GameWebSocketHandler extends TextWebSocketHandler implements iHandler {

    @Autowired
    Fachada fachada;

    Dictionary<WebSocketSession, LoginUsuarioDTO> usuariosConectadosbySocket;
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
            sendMessageSafely(session, response);
            return;
        }

        ObjectNode response = new ObjectMapper().createObjectNode();

        String tipo = node.get("tipo").asString();

        if (tipo == null) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "El mensaje no contiene un campo 'tipo' válido.");
            sendMessageSafely(session, new TextMessage(response.toString()));
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
                sendMessageSafely(session, new TextMessage(response.toString()));
                return;
            }
            response = pasarLobby(session, node);
        } else if (tipo.equals("MOVER_ELEMENTO")) {
            if (usuariosConectadosbySocket.get(session) == null) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "El jugador no ha iniciado sesión.");
                sendMessageSafely(session, new TextMessage(response.toString()));
                return;
            }
            response = procesarMovimiento(session, node);
        } else if (tipo.equals("DESPLEGAR")) {
            if (usuariosConectadosbySocket.get(session) == null) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "El jugador no ha iniciado sesión.");
                sendMessageSafely(session, new TextMessage(response.toString()));
                return;
            }
            response = procesarDespliegue(session, node);
        } else if (tipo.equals("DISPARAR_BOMBA") || tipo.equals("DISPARAR")) {
            if (usuariosConectadosbySocket.get(session) == null) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "El jugador no ha iniciado sesión.");
                sendMessageSafely(session, new TextMessage(response.toString()));
                return;
            }
            response = procesarDisparo(session, node);
        } else if (tipo.equals("RECARGAR")) {
            if (usuariosConectadosbySocket.get(session) == null) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "El jugador no ha iniciado sesión.");
                sendMessageSafely(session, new TextMessage(response.toString()));
                return;
            }
            response = procesarRecarga(session, node);
        } else if (tipo.equals("PING")) {
            // Responder a PING con PONG para medir latencia
            response.put("tipo", "PONG");
            response.put("timestamp", System.currentTimeMillis());
        } else {
            // Tipo de mensaje no reconocido - responder con error
            System.out.println("Tipo de mensaje no reconocido: " + tipo);
            response.put("tipo", "ERROR");
            response.put("mensaje", "Tipo de mensaje no reconocido: " + tipo);
        }
        sendMessageSafely(session, new TextMessage(response.toString()));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // Puse esto porque no me estaba conectando
        LoginUsuarioDTO jugador = usuariosConectadosbySocket.get(session);

        // Remover el jugador de ambas tablas de conexión
        usuariosConectadosbySocket.remove(session);
        if (jugador != null) {
            usuariosConectadosbyIdJugador.remove(jugador.getId());
            try {
                fachada.desconectarUsuario(jugador.getId());
            } catch (Exception e) {
                // TODO Auto-generated catch block
                e.printStackTrace();
            }
        }

        System.out.println("Cliente desconectado: " + session.getId());
    }

    //Envía un mensaje de forma segura sincronizando en la sesión para evitar
    //error cuando múltiples threads intentan enviar mensajes simultáneamente a la misma sesión

    private void sendMessageSafely(WebSocketSession session, TextMessage message) throws IOException {
        if (session == null || !session.isOpen()) {
            return;
        }
        synchronized (session) {
            session.sendMessage(message);
        }
    }

    @Override
    public boolean enviarAcciones(List<EntidadJugador> jugadores, CambiosDTO cambios) {
       

        ObjectMapper mapper = new ObjectMapper();
        mapper.clearCaches();
        ObjectNode sobre = mapper.createObjectNode();
        sobre.put("tipo", "ACTUALIZAR_PARTIDA");
        sobre.set("datos", mapper.valueToTree(cambios));

       
        for (EntidadJugador jugador : jugadores) {
            try {
                WebSocketSession session = usuariosConectadosbyIdJugador.get(jugador.getId());
                if (session != null && session.isOpen()) {
                    sendMessageSafely(session, new TextMessage(jsonFinal));
                    enviado = true;
                    System.out.println("ACTUALIZAR_PARTIDA enviado a jugador:" + jugador.getId());
                } else {
                    System.out.println("No se envio ACTUALIZAR_PARTIDA a jugador:" + jugador.getId()
                            + " (session nula o cerrada)");
                }
            } catch (Exception e) {
               
                System.err.println(
                        "Error enviando ACTUALIZAR_PARTIDA a jugador:" + jugador.getId() + ": " + e.getMessage());
            }
        }

        return true;

    }

    private ObjectNode procesarDespliegue(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        try {
            int idPortaDron = node.get("IdPortaDron").asInt();

            if (idPortaDron < 0) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "ID de portadrón inválido.");
                return response;
            }

            System.out.println("DESPLEGAR recibido -> jugador=" + usuariosConectadosbySocket.get(session).getId()
                    + " idPortaDron=" + idPortaDron);

            boolean resultado = fachada.accion_desplegar(usuariosConectadosbySocket.get(session).getId(), idPortaDron);

            if (resultado) {
                response.put("tipo", "DESPLIEGUE_PROCESADO");
                System.out.println("DESPLIEGUE_PROCESADO -> idPortaDron=" + idPortaDron);
            } else {
                response.put("tipo", "DESPLIEGUE_FALLIDO");
                response.put("mensaje", "No se pudo desplegar el dron.");
                System.out.println("DESPLIEGUE_FALLIDO -> idPortaDron=" + idPortaDron);
            }
        } catch (Exception e) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "Error al procesar el despliegue: " + e.getMessage());
            System.err.println("ERROR en procesarDespliegue: " + e.getMessage());
        }

        return response;
    }

    private ObjectNode procesarDisparo(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();
        // Sabine metió mano acá, esto hay que cambiarlo luego cuando se implemente
        // GameLoop,
        // se debería encolar y mandar en cada tick, ahora está mandando mensajes
        // directamente
        // para probar si el Frontend los agarra
        try {
            int idElemento = -1;
            if (node.has("IdDron") && !node.get("IdDron").isNull()) {
                idElemento = node.get("IdDron").asInt();
            } else if (node.has("idElemento") && !node.get("idElemento").isNull()) {
                idElemento = node.get("idElemento").asInt();
            }

            if (idElemento < 0) {
                response.put("tipo", "DISPARO_FALLIDO");
                response.put("mensaje", "Falta IdDron/idElemento para procesar el disparo.");
                return response;
            }

            System.out.println("DISPARAR recibido -> jugador=" + usuariosConectadosbySocket.get(session).getId()
                    + " idDron=" + idElemento);

            boolean resultado = fachada.accion_disparar(usuariosConectadosbySocket.get(session).getId(), idElemento);

            if (resultado) {
                response.put("tipo", "DISPARO_PROCESADO");
                System.out.println("DISPARO_PROCESADO -> idDron=" + idElemento);
            } else {
                response.put("tipo", "DISPARO_FALLIDO");
                response.put("mensaje", "No se pudo procesar el disparo.");
                System.out.println("DISPARO_FALLIDO -> idDron=" + idElemento);
            }
        } catch (Exception e) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "Error al procesar el disparo: " + e.getMessage());
            System.err.println("ERROR en procesarDisparo: " + e.getMessage());
        }

        return response;
    }

    private ObjectNode procesarRecarga(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        try {
            int idDron = node.has("IdDron") ? node.get("IdDron").asInt() : 
                         node.has("idDron") ? node.get("idDron").asInt() : -1;

            if (idDron < 0) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "Falta IdDron para procesar la recarga.");
                return response;
            }

            System.out.println("RECARGAR recibido -> jugador=" + usuariosConectadosbySocket.get(session).getId() + " idDron=" + idDron);

            boolean resultado = fachada.accion_recargar(usuariosConectadosbySocket.get(session), idDron);

            if (resultado) {
                response.put("tipo", "RECARGA_PROCESADA");
                System.out.println("RECARGA_PROCESADA -> idDron=" + idDron);
            } else {
                response.put("tipo", "RECARGA_FALLIDA");
                response.put("mensaje", "No se pudo procesar la recarga. Verifica que el dron esté sobre el portadron.");
                System.out.println("RECARGA_FALLIDA -> idDron=" + idDron);
            }
        } catch (Exception e) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "Error al procesar la recarga: " + e.getMessage());
            System.err.println("ERROR en procesarRecarga: " + e.getMessage());
        }

        return response;
    }

    private ObjectNode procesarMovimiento(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        // Sabine metió mano acá, esto va a tener que cambiar luego cuando se implemente
        // GameLoop
        // Se debería encolar y mandar en cada tick, ahora está mandando mensajes
        // directamente
        // para probar si el Frontend los agarra
        try {
            int idElemento = node.get("idElemento").asInt();
            float x = node.get("PosicionX").floatValue();
            float y = node.get("PosicionY").floatValue();
            float z = node.get("PosicionZ").floatValue();
            int angulo = node.get("Angulo").asInt();

            System.out.println("MOVER_ELEMENTO recibido -> jugador=" + usuariosConectadosbySocket.get(session).getId()
                    + " idElemento=" + idElemento + " x=" + x + " y=" + y + " z=" + z + " angulo=" + angulo);

            boolean resultado = fachada.accion_mover(usuariosConectadosbySocket.get(session).getId(), idElemento, x, y, z,
                    angulo);

            if (resultado) {
                response.put("tipo", "MOVIMIENTO_PROCESADO"); // esto luego significa que está encolado y con próximo
                                                              // tick se ejecuta
                System.out.println("MOVIMIENTO_PROCESADO -> idElemento=" + idElemento);
            } else {
                response.put("tipo", "MOVIMIENTO_FALLIDO");
                response.put("mensaje", "No se pudo procesar el movimiento.");
                System.out.println("MOVIMIENTO_FALLIDO -> idElemento=" + idElemento);
            }
        } catch (Exception e) {
            response.put("tipo", "ERROR");
            response.put("mensaje", "Error al procesar el movimiento: " + e.getMessage());
            System.err.println("ERROR en procesarMovimiento: " + e.getMessage());
        }

        return response;
    }

    private ObjectNode pasarLobby(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();

        try {
            fachada.pasarALobby(usuariosConectadosbySocket.get(session).getId());
            response.put("tipo", "PASAR_LOBBY_EXITOSO");
        } catch (LobbyException e) {
            response.put("tipo", "PASAR_LOBBY_FALLIDO");
            response.put("mensaje", e.getMessage());
            return response;
        }

        return response;
    }

    private ObjectNode RegistrarJugador(WebSocketSession session, JsonNode node) throws Exception {

        JsonNode nicknameNode = node.has("nickname") ? node.get("nickname") : node.get("NickName");
        JsonNode teamNode = node.has("team") ? node.get("team") : node.get("Team");

        if (nicknameNode == null || teamNode == null) {
            ObjectNode errorResponse = new ObjectMapper().createObjectNode();
            errorResponse.put("tipo", "REGISTRO_FALLIDO");
            errorResponse.put("mensaje", "Faltan campos requeridos: nickname y team");
            return errorResponse;
        }

        String nickname = nicknameNode.asString();
        String team = teamNode.asString();
        ObjectNode response = new ObjectMapper().createObjectNode();

        LoginUsuarioDTO nuevoJugador = null;

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
        // Handle both lowercase and capitalized field names for compatibility
        JsonNode nicknameNode = node.has("nickname") ? node.get("nickname") : node.get("NickName");

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode response = mapper.createObjectNode();

        if (nicknameNode == null) {
            response.put("tipo", "LOGIN_FALLIDO");
            response.put("mensaje", "Falta campo requerido: nickname");
            return response;
        }

        String nickname = nicknameNode.asString();

        try {

            LoginUsuarioDTO login = fachada.loginUsuario(nickname);
            response = mapper.valueToTree(login);

            usuariosConectadosbySocket.put(session, login);
            usuariosConectadosbyIdJugador.put(login.getId(), session);
            System.err.println("Jugador " + login.getNickName() + " ha iniciado sesión con ID: " + login.getId());

            
            response.put("tipo", "LOGIN_EXITOSO");
        } catch (Exception JugadorNoExisteException) {

            response.put("tipo", "LOGIN_FALLIDO");
            response.put("mensaje", "Nickname no encontrado");

        }

        return response;

    }

    @Override
    public boolean enviarInicioPartida(EscenarioInicialDTO partida) {

        ObjectMapper mapper = new ObjectMapper();
        ObjectNode sobre = mapper.createObjectNode();
        JsonNode datos = mapper.valueToTree(partida);
        sobre.put("tipo", "PARTIDA_INICIADA");
        sobre.set("datos", datos);
        String jsonFinal = mapper.writeValueAsString(sobre);

        for (JugadorDTO jugador : partida.getListaJugadores()) {
            try {
                WebSocketSession session = usuariosConectadosbyIdJugador.get(jugador.getId());
                sendMessageSafely(session, new TextMessage(jsonFinal));
            } catch (IOException e) {
                System.err.println("Error al enviar mensaje al jugador: " + e.getMessage());
            }
        }

        return true;
    }

    @Override
    public boolean enviarFinPartida(List<Jugador> jugadores, String ganadorId) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode sobre = mapper.createObjectNode();
        sobre.put("tipo", "FIN_PARTIDA");
        sobre.put("ganador", ganadorId);
        
        String jsonFinal;
        try {
            jsonFinal = mapper.writeValueAsString(sobre);
            
            for (Jugador jugador : jugadores) {
                try {
                    WebSocketSession session = usuariosConectadosbyIdJugador.get(jugador.getId());
                    if (session != null && session.isOpen()) {
                        sendMessageSafely(session, new TextMessage(jsonFinal));
                    }
                } catch (Exception e) {
                    System.err.println("Error al enviar FIN_PARTIDA al jugador " + jugador.getId() + ": " + e.getMessage());
                }
            }
            
            return true;
        } catch (Exception e) {
            System.err.println("Error creando mensaje FIN_PARTIDA: " + e.getMessage());
            return false;
        }
    }

}