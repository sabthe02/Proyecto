package com.Proyecto.SpringBoot.websocket;

import java.io.IOException;
import java.util.Dictionary;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.Proyecto.SpringBoot.Logica.Evento;
import com.Proyecto.SpringBoot.Logica.Bomba;
import com.Proyecto.SpringBoot.Logica.Dron;
import com.Proyecto.SpringBoot.Logica.Elemento;
import com.Proyecto.SpringBoot.Logica.Fachada;
import com.Proyecto.SpringBoot.Logica.Misil;
import com.Proyecto.SpringBoot.Logica.Municion;
import com.Proyecto.SpringBoot.Logica.PortaDron;
import com.Proyecto.SpringBoot.Logica.iHandler;
import com.Proyecto.SpringBoot.Logica.DTO.EscenarioInicialDTO;
import com.Proyecto.SpringBoot.Logica.DTO.JugadorDTO;
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
        }else if (tipo.equals("DISPARAR_BOMBA") || tipo.equals("DISPARAR")) {
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
        if (jugadores == null || acciones == null || acciones.isEmpty()) {
            return false;
        }
        //Sabine metió mano acá, por favor corregir si está mal!!
        ObjectNode response = new ObjectMapper().createObjectNode();
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode sobre = mapper.createObjectNode();
        ObjectNode datos = mapper.createObjectNode();
        tools.jackson.databind.node.ArrayNode elementos = mapper.createArrayNode();

        for (Evento accion : acciones) {
            if (accion == null) {
                continue;
            }

            Elemento elemento = accion.getElemento();
            if (elemento == null) {
                continue;
            }

            ObjectNode jsonElemento = mapper.createObjectNode();
            jsonElemento.put("id", elemento.getId());
            jsonElemento.put("x", elemento.getPosicionX());
            jsonElemento.put("y", elemento.getPosicionY());
            jsonElemento.put("z", elemento.getPosicionZ());
            jsonElemento.put("angulo", elemento.getAngulo());
            jsonElemento.put("vida", elemento.getVida());
            jsonElemento.put("estado", elemento.getEstado().toString());

            if (elemento instanceof PortaDron) {
                PortaDron porta = (PortaDron) elemento;
                jsonElemento.put("clase", "PORTADRON");
                jsonElemento.put("tipoEquipo", porta.getTipo().toString());
            } else if (elemento instanceof Dron) {
                Dron dron = (Dron) elemento;
                jsonElemento.put("clase", "DRON");
                jsonElemento.put("tipoEquipo", dron.getTipo().toString());

                int municionDisponible = 0;
                String tipoMunicion = "MISIL";
                if (dron.getTipo().toString().equals("AEREO")) {
                    tipoMunicion = "BOMBA";
                }
                if (dron.getMuniciones() != null) {
                    for (Municion municion : dron.getMuniciones()) {
                        if (municion == null) {
                            continue;
                        }
                        if (!municion.isUsada()) {
                            municionDisponible++;
                        }
                        if (municion instanceof Bomba) {
                            tipoMunicion = "BOMBA";
                        } else if (municion instanceof Misil) {
                            tipoMunicion = "MISIL";
                        }
                    }
                }

                jsonElemento.put("municionDisponible", municionDisponible);
                jsonElemento.put("tipoMunicion", tipoMunicion);
            } else if (elemento instanceof Misil) {
                Misil misil = (Misil) elemento;
                jsonElemento.put("clase", "MISIL");
                jsonElemento.put("velocidad", misil.getVelocidad());
                jsonElemento.put("alcance", misil.getDistancia());
            } else if (elemento instanceof Bomba) {
                Bomba bomba = (Bomba) elemento;
                jsonElemento.put("clase", "BOMBA");
                jsonElemento.put("radioExplosion", bomba.getRadioExplosion());
            }

            elementos.add(jsonElemento);
        }

        if (elementos.isEmpty()) {
            return false;
        }

        datos.set("elementos", elementos);
        sobre.put("tipo", "ACTUALIZAR_PARTIDA");
        sobre.set("datos", datos);
        String jsonFinal = mapper.writeValueAsString(sobre);

        boolean enviado = false;
        for (Jugador jugador : jugadores) {
            if (jugador == null) {
                continue;
            }

            try {
                WebSocketSession session = usuariosConectadosbyIdJugador.get(jugador.getId());
                if (session != null && session.isOpen()) {
                    session.sendMessage(new TextMessage(jsonFinal));
                    enviado = true;
                    System.out.println("ACTUALIZAR_PARTIDA enviado a jugador:" + jugador.getId());
                } else {
                    System.out.println("No se envio ACTUALIZAR_PARTIDA a jugador:" + jugador.getId() + " (session nula o cerrada)");
                }
            } catch (Exception e) {
                response.put("tipo", "ERROR");
                response.put("mensaje", "Error al procesar al enviar la accion: " + e.getMessage());
                System.err.println("[WS] Error enviando ACTUALIZAR_PARTIDA a jugador:" + jugador.getId() + ": " + e.getMessage());
            }
        }

        return enviado;
    }

    private ObjectNode procesarDisparo(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();
//Sabine metió mano acá, esto hay que cambiarlo luego cuando se implemente GameLoop, 
// se debería encolar y mandar en cada tick, ahora está mandando mensajes directamente 
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

            System.out.println("DISPARAR recibido -> jugador=" + usuariosConectadosbySocket.get(session).getId() + " idDron=" + idElemento);

            boolean resultado = fachada.accion_disparar(usuariosConectadosbySocket.get(session), idElemento);

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

    private ObjectNode procesarMovimiento(WebSocketSession session, JsonNode node) {
        ObjectNode response = new ObjectMapper().createObjectNode();
        
        // Sabine metió mano acá, esto va a tener que cambiar luego cuando se implemente GameLoop
        // Se debería encolar y mandar en cada tick, ahora está mandando mensajes directamente 
        //para probar si el Frontend los agarra
        try {
            int idElemento = node.get("idElemento").asInt();
            float x = node.get("PosicionX").floatValue();
            float y = node.get("PosicionY").floatValue();
            float z = node.get("PosicionZ").floatValue();
            int angulo = node.get("Angulo").asInt();

            System.out.println("[WS] MOVER_ELEMENTO recibido -> jugador=" + usuariosConectadosbySocket.get(session).getId() + " idElemento=" + idElemento + " x=" + x + " y=" + y + " z=" + z + " angulo=" + angulo);

            boolean resultado = fachada.accion_mover(usuariosConectadosbySocket.get(session), idElemento, x, y, z, angulo);

            if (resultado) {
                response.put("tipo", "MOVIMIENTO_PROCESADO"); // esto luego significa que está encolado y con próximo tick se ejecuta
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
                session.sendMessage(new TextMessage(jsonFinal));
            } catch (IOException e) {
                System.err.println("Error al enviar mensaje al jugador: " + e.getMessage());
            }
        }

        return true;
    }

}