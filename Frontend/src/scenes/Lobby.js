import { NetworkManager } from './NetworkManager.js';

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

        // Initializar NetworkManager
        this.network = new NetworkManager(this);
        this.socket = this.network.socket;

        // Escuchar eventos del backend
        this.events.on('PARTIDA_INICIADA', (data) => {
            console.log('Juego iniciando:', data);
            this.statusText.setText('Iniciando juego...');
            
            // Extraer el equipo del jugador desde listaJugadores
            const playerId = sessionStorage.getItem('playerId') || '';
            let playerTeam = 'NAVAL'; // Default
            
            if (data.datos && data.datos.listaJugadores) {
                const jugador = data.datos.listaJugadores.find(j => j.id === playerId);
                if (jugador && jugador.team) {
                    playerTeam = jugador.team;
                    console.log('Equipo del jugador extraido:', playerTeam);
                }
            }
            
            this.scene.start('Game', {
                playerId: playerId,
                nickname: sessionStorage.getItem('nickname') || 'Player',
                team: playerTeam,
                partidaInicial: data.datos
            });
        });

        this.events.on('OPONENTE_ENCONTRADO', (data) => {
            console.log('Oponente encontrado:', data);
            this.statusText.setText('Oponente encontrado - iniciando...');
        });

        this.events.on('ERROR', (data) => {
            console.error('Error en lobby:', data);
        });
    }

    update() {
        if (this.bg) this.bg.x += 0.1;
    }

}