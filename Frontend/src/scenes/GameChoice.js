import { NetworkManager } from './NetworkManager.js';

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

        // Verificar si el jugador tiene partidas guardadas
        const partidaGuardada = sessionStorage.getItem('partidaGuardada') === 'true';

        // botones
        const containerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:18px;">
                <button id="recargar" style="padding:14px 28px;border-radius:25px;border:none;background:linear-gradient(90deg, #e1f1f158, #e1f1f19a);color:#000;font-size:20px;font-weight:bold;cursor:pointer;transition:all 0.25s ease;box-shadow:0 0 10px rgba(18,18,18,0.83);display:${partidaGuardada ? 'block' : 'none'};">Recargar partida guardada</button>
                <button id="lobby" style="padding:14px 28px;border-radius:25px;border:none;background:linear-gradient(90deg, #e1f1f158, #e1f1f19a);color:#000;font-size:20px;font-weight:bold;cursor:pointer;transition:all 0.25s ease;box-shadow:0 0 10px rgba(18,18,18,0.83);">Ir al lobby</button>
            </div>
        `;

        const dom = this.add.dom(width / 2, height / 2).createFromHTML(containerHTML);
        dom.node.style.pointerEvents = 'auto';

        const recargarBtn = dom.node.querySelector('#recargar');
        const lobbyBtn = dom.node.querySelector('#lobby');

        // Agregar animaciones solo a botones visibles
        const botonesVisibles = partidaGuardada ? [recargarBtn, lobbyBtn] : [lobbyBtn];

        botonesVisibles.forEach(btn => {
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

        // Recargar partida guardada: envía RECARGAR_PARTIDA al backend
        if (partidaGuardada) {
            recargarBtn.addEventListener('click', () => {
                recargarBtn.disabled = true;
                this.errorText.setText('');
                if (!this.network) {
                    this.network = new NetworkManager(this);
                }
                this.network.recargarPartida();
            });
        }

        // Initialize NetworkManager (crea/reusa conexión WebSocket)
        this.network = new NetworkManager(this);
        this.socket = this.network.socket;
        this.pendingLobbyRequest = false;

        // Escucha mensajes del NetworkManager para manejar eventos relacionados con la partida y el lobby
        this.events.on('PARTIDA_RECARGADA_EXITOSO', () => {
            console.log('Partida encontrada, esperando PARTIDA_INICIADA...');
            if (this.statusText) {
                this.statusText.setText('Partida encontrada, cargando...');
            }
        });

        this.events.on('PARTIDA_RECARGADA_FALLIDO', (data) => {
            const msg = (data && data.mensaje) ? data.mensaje : 'No se encontró partida guardada.';
            this.errorText.setText(msg);
            if (recargarBtn) {
                recargarBtn.disabled = false;
            }
        });

        this.events.on('PARTIDA_INICIADA', (data) => {
            console.log('PARTIDA INICIADA! datos:', data);
            const extras = {
                playerId: sessionStorage.getItem('playerId') || '',
                nickname: sessionStorage.getItem('nickname') || 'Player',
                partidaInicial: data.datos
            };
            this.scene.start('Game', extras);
        });

        this.events.on('PASAR_LOBBY_EXITOSO', (data) => {
            console.log('Paso al lobby exitosamente:', data);
            if (this.statusText) {
                this.statusText.setText('Entrando al lobby...');
            }
            this.errorText.setText('');
            this.pendingLobbyRequest = false;
            this.scene.start('Lobby');
        });

        this.events.on('PASAR_LOBBY_FALLIDO', (data) => {
            console.error('Error al pasar al lobby:', data);
            const msg = data.mensaje || 'Error al pasar al lobby';
            this.errorText.setText(msg);
            this.pendingLobbyRequest = false;
            lobbyBtn.disabled = false;
        });

        // Si se pasa al lobby, se manda mensaje al servidor para avisar que el jugador quiere entrar al lobby (y el servidor responde con PASAR_LOBBY_EXITOSO o PASAR_LOBBY_FALLIDO)
        lobbyBtn.addEventListener('click', () => {
            if (this.pendingLobbyRequest) {
                return;
            }
            this.pendingLobbyRequest = true;
            lobbyBtn.disabled = true;
            this.errorText.setText('');

            // Usar NetworkManager
            if (!this.network) {
                this.network = new NetworkManager(this);
            }
            
            const enviado = this.network.pasarLobby();
            
            if (!enviado) {
                console.warn('Socket no esta abierto');
                this.errorText.setText('Error: conexion no disponible');
                this.pendingLobbyRequest = false;
                lobbyBtn.disabled = false;
            } else {
                console.log('PASAR_LOBBY enviado');
            }
        });
    }

    update() {
        if (this.bg) this.bg.x += 0.1;
    }

}
