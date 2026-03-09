export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
       
        if (!window.gameSocket) {
            window.gameSocket = new WebSocket("ws://localhost:8080/ws");
        }
        
        this.socket = window.gameSocket;
        this.lastPingTime = 0;
        this.latency = 0;
        this.init();
    }

    init() {
        this.socket.onopen = () => {
            console.log("NetworkManager: Conectado");
            // Iniciar ping periódico cada 2 segundos
            this.iniciarPing();
        };
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // Ignorar mensajes sin tipo (malformados o vacíos)
            if (!data.tipo) {
                // No hacer log de mensajes vacíos (ping del servidor)
                return;
            }
            
            // Manejar respuesta de PONG para calcular latencia
            if (data.tipo === 'PONG') {
                this.latency = Date.now() - this.lastPingTime;
                this.scene.events.emit('LATENCY_UPDATE', this.latency);
                // No hacer log de PONG para evitar spam
                return;
            }
            
            // Log solo de mensajes importantes (no ACTUALIZAR_PARTIDA ni MOVIMIENTO_PROCESADO)
            if (data.tipo !== 'ACTUALIZAR_PARTIDA' && data.tipo !== 'MOVIMIENTO_PROCESADO') {
                // Mensaje: tipo
            } else if (data.tipo === 'ACTUALIZAR_PARTIDA') {
                // Backend sends datos.elementos with 'clase' field (DRON, PORTADRON, MISIL, BOMBA)
                const elementos = data.datos?.elementos || [];
                console.log(`ACTUALIZAR_PARTIDA: ${elementos.length} elementos recibidos`);
                if (this.scene && this.scene.events) {
                    this.scene.events.emit('ACTUALIZAR_PARTIDA', data);
                }
                return;
            }

            // Emitir evento en la escena
            if (this.scene && this.scene.events) {
                this.scene.events.emit(data.tipo, data);
            }
        };

        this.socket.onerror = (err) => console.error("Error de red:", err);
    }
    
    iniciarPing() {
        // Enviar PING cada 2 segundos para medir latencia
        setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.lastPingTime = Date.now();
                this.send('PING', { timestamp: this.lastPingTime });
            }
        }, 2000);
    }

    // Método genérico para enviar mensajes al backend
    send(tipo, contenido = {}) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const mensaje = { tipo, ...contenido };
            this.socket.send(JSON.stringify(mensaje));
            return true;
        } else {
            console.warn(`Intento de enviar ${tipo} con socket cerrado.`);
            return false;
        }
    }

    // Métodos específicos para cada tipo de mensaje del protocolo
    
    // Autenticación y Lobby
    registrarJugador(nickname, team) {
        return this.send('REGISTRAR_JUGADOR', { nickname: nickname, team: team });
    }

    loginJugador(nickname) {
        return this.send('LOGIN_JUGADOR', { nickname: nickname });
    }

    pasarLobby() {
        return this.send('PASAR_LOBBY');
    }

    // Acciones de Juego
    moverElemento(idElemento, posicionX, posicionY, posicionZ, angulo) {
        return this.send('MOVER_ELEMENTO', {
            idElemento: Number(idElemento),
            PosicionX: Number(posicionX),
            PosicionY: Number(posicionY),
            PosicionZ: Number(posicionZ),
            Angulo: Number(angulo)
        });
    }

    disparar(idDron) {
        return this.send('DISPARAR', { IdDron: Number(idDron) });
    }

    recargar(idDron, idPortadron) {
        return this.send('RECARGAR', {
            IdDron: Number(idDron),
            IdPortadron: Number(idPortadron)
        });
    }

    desplegarDron() {
        return this.send('DESPLEGAR_DRON');
    }

    finalizarPartida(idJugador, mensaje) {
        return this.send('FINALIZAR_PARTIDA', {
            idJugador: idJugador,
            Mensaje: mensaje
        });
    }

    guardarPartida(idJugador, mensaje) {
        return this.send('GUARDAR_PARTIDA', {
            idJugador: idJugador,
            Mensaje: mensaje
        });
    }
}