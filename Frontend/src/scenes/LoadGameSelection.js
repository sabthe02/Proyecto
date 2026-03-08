import { NetworkManager } from './NetworkManager.js';

export class LoadGameSelection extends Phaser.Scene {

    constructor() {
        super('LoadGameSelection');
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
        const title = this.add.text(width / 2, 100, 'Elegir partida para recargar', {
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

        // Texto de estado
        this.statusText = this.add.text(width / 2, 180, 'Cargando partidas guardadas...', {
            fontSize: '18px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Texto de error
        this.errorText = this.add.text(width / 2, height / 2 + 200, '', {
            fontSize: '18px',
            fill: '#ff6b6b',
            align: 'center'
        }).setOrigin(0.5);

        // Contenedor para la tabla de partidas
        this.gamesContainer = this.add.dom(width / 2, height / 2 + 50).createFromHTML(`
            <div id="games-list" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                max-height: 400px;
                overflow-y: auto;
                padding: 10px;
            "></div>
        `);
        this.gamesContainer.node.style.pointerEvents = 'auto';

        // Boton volver
        const backButton = this.add.dom(width / 2, height - 80).createFromHTML(`
            <button id="back-btn" style="
                padding: 12px 24px;
                border-radius: 25px;
                border: none;
                background: linear-gradient(90deg, #e1f1f158, #e1f1f19a);
                color: #000;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.25s ease;
                box-shadow: 0 0 10px rgba(18, 18, 18, 0.83);
            ">Volver</button>
        `);
        backButton.node.style.pointerEvents = 'auto';

        const backBtn = backButton.node.querySelector('#back-btn');
        this.addButtonAnimations(backBtn);

        backBtn.addEventListener('click', () => {
            this.scene.start('GameChoice');
        });

        // Initialize NetworkManager
        this.network = new NetworkManager(this);
        this.socket = this.network.socket;

        // Escuchar eventos
        this.events.on('RECARGAR_PARTIDAS_EXITOSO', (data) => {
            console.log('RECARGAR_PARTIDAS_EXITOSO:', data);
            this.statusText.setText('');
            this.errorText.setText('');
            this.mostrarPartidas(data.partidas || []);
        });

        this.events.on('RECARGAR_PARTIDAS_FALLIDO', (data) => {
            console.error('RECARGAR_PARTIDAS_FALLIDO:', data);
            const mensaje = data.mensaje || 'Error al cargar partidas guardadas';
            this.statusText.setText('');
            this.errorText.setText(mensaje);
        });

        this.events.on('RECARGAR_PARTIDA_ESPECIFICA_EXITOSO', (data) => {
            console.log('RECARGAR_PARTIDA_ESPECIFICA_EXITOSO:', data);
            this.statusText.setText('Cargando partida...');
            this.errorText.setText('');
        });

        this.events.on('RECARGAR_PARTIDA_ESPECIFICA_FALLIDO', (data) => {
            console.error('RECARGAR_PARTIDA_ESPECIFICA_FALLIDO:', data);
            const mensaje = data.mensaje || 'Error al recargar la partida';
            this.statusText.setText('');
            this.errorText.setText(mensaje);
        });

        this.events.on('INICIAR_PARTIDA', (data) => {
            console.log('INICIAR_PARTIDA (desde partida guardada):', data);
            const extras = {
                playerId: sessionStorage.getItem('playerId') || '',
                nickname: sessionStorage.getItem('nickname') || 'Player',
                partidaInicial: data.datos
            };
            this.scene.start('Game', extras);
        });

        // Solicitar lista de partidas guardadas
        this.solicitarPartidasGuardadas();
    }

    addButtonAnimations(btn) {
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
    }

    solicitarPartidasGuardadas() {
        if (!this.network) {
            this.network = new NetworkManager(this);
        }

        const enviado = this.network.send('RECARGAR_PARTIDAS', {});

        if (!enviado) {
            console.warn('Socket no esta abierto');
            this.statusText.setText('');
            this.errorText.setText('Error: conexion no disponible');
        } else {
            console.log('RECARGAR_PARTIDAS enviado');
        }
    }

    mostrarPartidas(partidas) {
        const gamesListDiv = this.gamesContainer.node.querySelector('#games-list');

        if (!partidas || partidas.length === 0) {
            gamesListDiv.innerHTML = `
                <div style="
                    color: white;
                    font-size: 18px;
                    text-align: center;
                    padding: 20px;
                ">No hay partidas guardadas</div>
            `;
            return;
        }

        // Crear tabla de partidas
        let tableHTML = `
            <table style="
                border-collapse: collapse;
                width: 100%;
                max-width: 600px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 10px;
                overflow: hidden;
            ">
                <thead>
                    <tr style="background: rgba(225, 241, 241, 0.2);">
                        <th style="padding: 12px; color: white; font-size: 16px; border-bottom: 2px solid rgba(225, 241, 241, 0.3);">ID Partida</th>
                        <th style="padding: 12px; color: white; font-size: 16px; border-bottom: 2px solid rgba(225, 241, 241, 0.3);">Oponente</th>
                        <th style="padding: 12px; color: white; font-size: 16px; border-bottom: 2px solid rgba(225, 241, 241, 0.3);">Acción</th>
                    </tr>
                </thead>
                <tbody>
        `;

        partidas.forEach((partida, index) => {
            const idPartida = partida.idPartida || partida.id || index;
            const oponente = partida.apodoOponente || partida.oponente || 'Desconocido';

            tableHTML += `
                <tr style="border-bottom: 1px solid rgba(225, 241, 241, 0.1);">
                    <td style="padding: 12px; color: white; text-align: center;">${idPartida}</td>
                    <td style="padding: 12px; color: white; text-align: center;">${oponente}</td>
                    <td style="padding: 12px; text-align: center;">
                        <button class="load-game-btn" data-game-id="${idPartida}" style="
                            padding: 8px 16px;
                            border-radius: 15px;
                            border: none;
                            background: linear-gradient(90deg, #4CAF50, #45a049);
                            color: white;
                            font-size: 14px;
                            font-weight: bold;
                            cursor: pointer;
                            transition: all 0.25s ease;
                            box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
                        ">Recargar esta partida</button>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        gamesListDiv.innerHTML = tableHTML;

        // Agregar event listeners a los botones
        const loadButtons = gamesListDiv.querySelectorAll('.load-game-btn');
        loadButtons.forEach(btn => {
            this.addButtonAnimations(btn);

            btn.addEventListener('click', () => {
                const gameId = btn.getAttribute('data-game-id');
                this.recargarPartidaEspecifica(gameId);
            });
        });
    }

    recargarPartidaEspecifica(idPartida) {
        console.log('Recargando partida:', idPartida);
        this.statusText.setText('Cargando partida...');
        this.errorText.setText('');

        if (!this.network) {
            this.network = new NetworkManager(this);
        }

        const enviado = this.network.send('RECARGAR_PARTIDA_ESPECIFICA', {
            idPartida: idPartida
        });

        if (!enviado) {
            console.warn('Socket no esta abierto');
            this.statusText.setText('');
            this.errorText.setText('Error: conexion no disponible');
        } else {
            console.log('RECARGAR_PARTIDA_ESPECIFICA enviado con id:', idPartida);
        }
    }

    update() {
        this.bg.x += 0.1;
    }
}
