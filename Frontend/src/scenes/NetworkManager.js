export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
       
        if (!window.gameSocket) {
            window.gameSocket = new WebSocket("ws://localhost:8080/ws");
        }
        
        this.socket = window.gameSocket;
        this.init();
    }

    init() {
        this.socket.onopen = () => console.log("NetworkManager: Conectado");
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
        
            if (this.scene && this.scene.events) {
                this.scene.events.emit(`net-${data.tipo}`, data);
            }
            
            
            console.log(` Mensaje recibido: ${data.tipo}`, data);
        };

        this.socket.onerror = (err) => console.error("Error de red:", err);
    }

    // Método genérico para enviar mensajes al backend
    send(tipo, contenido = {}) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const mensaje = { tipo, ...contenido };
            this.socket.send(JSON.stringify(mensaje));
        } else {
            console.warn('Intento de enviar ${tipo} con socket cerrado.');
        }
    }

    // Métodos específicos 
    registrarJugador(nickname) {
        this.send('REGISTRAR_JUGADOR', { nickname });
    }

    enviarMovimiento(x, y, angulo) {
        this.send('MOVER', { x, y, angulo });
    }
}