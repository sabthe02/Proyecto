export class GameChoice extends Phaser.Scene {

    constructor() {
        super('GameChoice');
    }

    preload() {
        if (this.textures.exists('menu_background')) {
            this.textures.remove('menu_background');
        }
        this.load.image('menu_background', 'assets/background.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Fondo
        this.bg = this.add.image(width / 2, height / 2, 'menu_background');
        this.bg.setDisplaySize(width, height);
        this.tweens.add({
            targets: this.bg,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 15000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Titulo
        const title = this.add.text(width / 2, 100, 'Opciones de partida', {
            fontSize: '42px',
            fontStyle: 'bold',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 6
        })
        .setOrigin(0.5)
        .setShadow(0, 0, '#e1f1f19a', 20, true, true);

        title.alpha = 0;
        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 1500,
            ease: 'Power2'
        });

        // Texto de error
        this.statusText = this.add.text(20, 20, '', { fontSize: '16px', fill: '#ffffff' }).setScrollFactor(0);
        this.errorText = this.add.text(width / 2, height / 2 + 150, '', { fontSize: '18px', fill: '#ff6b6b', align: 'center' }).setOrigin(0.5);

        // botones
        const containerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:18px;">
                <button id="recargar" style="padding:14px 28px;border-radius:25px;border:none;background:linear-gradient(90deg, #e1f1f158, #e1f1f19a);color:#000;font-size:20px;font-weight:bold;cursor:pointer;transition:all 0.25s ease;box-shadow:0 0 10px rgba(18,18,18,0.83);">Recargar partida guardada</button>
                <button id="lobby" style="padding:14px 28px;border-radius:25px;border:none;background:linear-gradient(90deg, #e1f1f158, #e1f1f19a);color:#000;font-size:20px;font-weight:bold;cursor:pointer;transition:all 0.25s ease;box-shadow:0 0 10px rgba(18,18,18,0.83);">Ir al lobby</button>
            </div>
        `;

        const dom = this.add.dom(width / 2, height / 2).createFromHTML(containerHTML);
        dom.node.style.pointerEvents = 'auto';

        const recargarBtn = dom.node.querySelector('#recargar');
        const lobbyBtn = dom.node.querySelector('#lobby');


        [recargarBtn, lobbyBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.08)';
                btn.style.boxShadow = '0 0 25px rgba(18, 18, 18, 0.83)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 0 10px rgba(248, 250, 250, 0.5)';
            });
            btn.addEventListener('mousedown', () => {
                btn.style.transform = 'scale(0.96)';
            });
            btn.addEventListener('mouseup', () => {
                btn.style.transform = 'scale(1.08)';
            });
        });

        // Recargar partida
        recargarBtn.addEventListener('click', () => {
            window.location.reload(); // Falta!!!
        });

        // WebSocket - usa la conexion global creada en Greeting.js para evitar reconexiones innecesarias
        this.socket = window.gameSocket;
        this.pendingLobbyRequest = false;

        this.socket.onopen = () => {
            console.log('[GameChoice] WebSocket conectado');
        };

        this.socket.onerror = (err) => {
            console.error('[GameChoice] WebSocket error', err);
        };

        this.socket.onclose = (ev) => {
            console.warn('[GameChoice] WebSocket cerrado', ev);
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('[GameChoice] WS onmessage:', data);
            
            let tipo = '';
            if (data.tipo) {
                tipo = String(data.tipo);
            }

            // Manejar comienzo del juego cuando PASAR_LOBBY_EXITOSO)
            if (tipo === 'PARTIDA_INICIADA') {
                console.log('¡PARTIDA INICIADA! datos:', data);
                // al comenzar partida arrancamos el escenario de juego
                // pasamos al menos el apodo/ equipo local si están disponibles
                // en este prototipo sólo utilizamos el apodo almacenado y un
                // equipo por defecto; el servidor todavía no decide el bando local
                const extras = {
                    playerId: sessionStorage.getItem('playerId') || '',
                    nickname: sessionStorage.getItem('nickname') || 'Player',
                    partidaInicial: data.datos
                };
                this.scene.start('Game', extras);
                return;
            }

            // Handle lobby response
            if (tipo === 'PASAR_LOBBY_EXITOSO') {
                console.log('Paso al lobby exitosamente:', data);
                if (this.statusText) {
                    this.statusText.setText('Entrando al lobby...');
                }
                this.errorText.setText('');
                this.pendingLobbyRequest = false;
                this.scene.start('Lobby');
                return;
            }

            if (tipo === 'PASAR_LOBBY_FALLIDO') {
                console.error('Error al pasar al lobby:', data);
                const msg = data.mensaje || 'Error al pasar al lobby';
                this.errorText.setText(msg);
                this.pendingLobbyRequest = false;
                lobbyBtn.disabled = false;
                return;
            }
        };

        // Si se pasa al lobby, se manda mensaje al servidor para avisar que el jugador quiere entrar al lobby (y el servidor responde con PASAR_LOBBY_EXITOSO o PASAR_LOBBY_FALLIDO)
        lobbyBtn.addEventListener('click', () => {
            if (this.pendingLobbyRequest) {
                return;
            }
            this.pendingLobbyRequest = true;
            lobbyBtn.disabled = true;
            this.errorText.setText('');

            const mensaje = {
                tipo: 'PASAR_LOBBY'
            };

            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                console.log('[GameChoice] Enviando PASAR_LOBBY');
                this.socket.send(JSON.stringify(mensaje));
            } else {
                console.warn('[GameChoice] Socket no esta abierto');
                this.errorText.setText('Error: conexion no disponible');
                this.pendingLobbyRequest = false;
                lobbyBtn.disabled = false;
            }
        });
    }

    update() {
        if (this.bg) this.bg.x += 0.1;
    }

}
