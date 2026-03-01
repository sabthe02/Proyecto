export class Lobby extends Phaser.Scene {

    constructor() {
        super('Lobby');
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
        const title = this.add.text(width / 2, 100, 'Sala de espera', {
            fontSize: '48px',
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

        // Mensaje de espera
        const waitingText = this.add.text(width / 2, height / 2, 'Esperando a que se conecte otro jugador...', {
            fontSize: '24px',
            fill: '#e1f1f1',
            align: 'center',
            wordWrap: { width: 600 }
        })
        .setOrigin(0.5);

        this.tweens.add({
            targets: waitingText,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Status text
        this.statusText = this.add.text(20, 20, 'Conectado', { fontSize: '16px', fill: '#90EE90' }).setScrollFactor(0);

        // WebSocket
        this.socket = window.gameSocket;

        this.socket.onopen = () => {
            console.log('[Lobby] WebSocket conectado');
            this.statusText.setText('Conectado - esperando oponente');
        };

        this.socket.onerror = (err) => {
            console.error('[Lobby] WebSocket error', err);
        };

        this.socket.onclose = () => {
            console.warn('[Lobby] WebSocket cerrado');
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('[Lobby] WS onmessage:', data);

            let tipo = '';
            if (data.tipo) {
                tipo = String(data.tipo);
            }

            // Cuando el servidor indica que el juego va a iniciar, navegamos a la escena del juego
            if (tipo === 'PARTIDA_INICIADA') {
                console.log('Juego iniciando:', data);
                this.statusText.setText('Iniciando juego...');
                // navegar a la escena del juego
                this.scene.start('Game', {
                    playerId: sessionStorage.getItem('playerId') || '',
                    nickname: sessionStorage.getItem('nickname') || 'Player',
                    partidaInicial: data.datos
                });
                return;
            }

            // Cuando se encuentra un contrincante
            if (tipo === 'OPONENTE_ENCONTRADO') {//// QUE MENSAJE ME VA A MANDAR EL SERVIDOR PARA AVISAR DE ESTO????
                console.log('Oponente encontrado:', data);
                this.statusText.setText('Oponente encontrado - iniciando...');
                return;
            }

            // Manejo errores
            if (tipo === 'ERROR') {
                console.error('Error en lobby:', data);
                return;
            }
        };
    }

    update() {
        if (this.bg) this.bg.x += 0.1;
    }

}