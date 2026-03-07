import { NetworkManager } from './NetworkManager.js';
import { EntityManager } from './EntityManager.js';
import { UIManager } from './UIManager.js';
import { InputManager } from './InputManager.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        // Datos de la partida y jugador
        this.playerTeam = data.team || 'NAVAL';
        this.playerId = data.playerId || sessionStorage.getItem('playerId') || '';
        this.nickname = data.nickname || 'Player';
        this.partidaInicial = data.partidaInicial || null;
        
        console.log('Game inicializado:', { team: this.playerTeam, id: this.playerId, nick: this.nickname });
    }

    preload() {
        // Cargado de assets
        this.load.path = 'assets/';
        this.load.image('texturaAgua', 'background/background.jpg');
        this.load.image('portadrones_aereo', 'portadrones/PortadronAereo.png');
        this.load.image('portadrones_naval', 'portadrones/portadronNaval.png');
        this.load.image('dron_aereo', 'drones/dronAereo.svg');
        this.load.image('dron_naval', 'drones/dronNaval.svg');
        this.load.image('proyectil_misil', 'effectos/speed.png');
        this.load.image('proyectil_bomba', 'effectos/fire00.png');
        
        // Cargar frames de animación de fuego para efectos de explosión
        for (let i = 0; i < 20; i++) {
            const frameNum = String(i).padStart(2, '0');
            this.load.image(`fire${frameNum}`, `effectos/fire${frameNum}.png`);
        }
    }

    create() {
        // Titulo del juego
        const width = this.scale.width;
        const title = this.add.text(width / 2, 20,
            'Combate Aéreo‑Naval con Drones',
            {
                fontSize: '28px',
                fontStyle: 'bold',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(5000)
        .setShadow(0, 0, '#e1f1f19a', 15, true, true);
        
        console.log('Creando escena con equipo:', this.playerTeam);
        
        // Crear animación de explosión desde los frames de fuego
        if (!this.anims.exists('explosion')) {
            const explosionFrames = [];
            for (let i = 0; i < 20; i++) {
                const frameNum = String(i).padStart(2, '0');
                explosionFrames.push({ key: `fire${frameNum}` });
            }
            this.anims.create({
                key: 'explosion',
                frames: explosionFrames,
                frameRate: 20,
                repeat: 0
            });
        }
        
        // Inicializar managers PRIMERO antes de crear elementos visuales
        this.network = new NetworkManager(this);
        this.entityManager = new EntityManager(this);
        this.uiManager = new UIManager(this);
        this.inputManager = new InputManager(this, this.network, this.playerId, null); // portadronId será configurado en PARTIDA_INICIADA
        
        // Conectar InputManager con UIManager para actualizar vista en HUD
        this.inputManager.configurarUIManager(this.uiManager);
        
        // Fondo - tamaño inicial conservador que se actualizará con el mapa real
        this.fondoAgua = this.add.tileSprite(0, 0, 4000, 4000, 'texturaAgua').setOrigin(0, 0);
        this.fondoAgua.setDepth(-1);
        
        // Contenedor de tiles del mapa (renderizado después de PARTIDA_INICIADA)
        this.mapTiles = null;
        this.mapaYaRenderizado = false;
        this.boundsWarningShown = false;
        this.worldWidth = 0;
        this.worldHeight = 0;
        
        // Procesar datos iniciales de la partida si fueron pasados desde Lobby
        if (this.partidaInicial) {
            console.log('Procesando partidaInicial desde Lobby');
            this.procesarPartidaIniciada(this.partidaInicial);
        }
        
        // Configurar cámara (bounds se actualizarán cuando se renderice el mapa)
        // Límites iniciales conservadores - ajustados automáticamente por renderizarMapa()
        this.cameras.main.setBounds(0, 0, 4000, 4000);
        this.cameras.main.setZoom(0.8); // Zoom out para vista táctica
        this.cameras.main.setLerp(0.1, 0.1); // Movimiento suave de cámara
        
        // Crear botón de salida
        this.crearBotonSalida();

        //////PROBANDO VISTA LATERAL, ELIMINAR LUEGO!!!!
        this.input.keyboard.on('keydown-I', () => {
            console.log('Disparando vista de impacto');
            this.mostrarVistaImpacto({
                tipoProyectil: 'MISIL',
                claseObjetivo: 'DRON',
                equipoObjetivo: 'AEREO'
            });
        });
        
        // Escuchar eventos del juego
        this.configurarEventListeners();
        
        // Manejador de redimensionamiento de ventana
        window.addEventListener('resize', () => this.manejarRedimension());
    }

    configurarEventListeners() {
        // Escuchar PARTIDA_INICIADA desde el Backend
        this.events.on('PARTIDA_INICIADA', (data) => {
            console.log('PARTIDA_INICIADA recibida:', data);
            if (data.datos) {
                this.procesarPartidaIniciada(data.datos);
            }
        });
        
        // Escuchar RECIBE_IMPACTO para mostrar vista lateral
        this.events.on('RECIBE_IMPACTO', (data) => {
            console.log('RECIBE_IMPACTO recibido:', data);
            this.mostrarVistaImpacto(data);
        });
        
        // ACTUALIZAR_PARTIDA ya lo escuchan EntityManager y UIManager
        // InputManager maneja todo el input (clic y tecla R)
    }

    procesarPartidaIniciada(datosPartida) {
        console.log('Procesando estado inicial del juego:', datosPartida);
        
        // Renderizar tiles del mapa desde la matriz (SOLO UNA VEZ)
        if (datosPartida.mapa && datosPartida.mapa.contenido) {
            if (!this.mapaYaRenderizado) {
                this.renderizarMapa(datosPartida.mapa.contenido);
                this.mapaYaRenderizado = true;
            }
        }
        if (this.mapaYaRenderizado) {
            console.warn('Mapa ya renderizado, ignorando llamada duplicada');
        }
        
        // Procesar información del jugador
        if (datosPartida.listaJugadores) {
            const jugador = datosPartida.listaJugadores.find(j => j.id === this.playerId);
            if (jugador) {
                console.log('Jugador encontrado:', jugador);
                if (jugador.team) {
                    this.playerTeam = jugador.team;
                }
                
                // Actualizar el texto de equipo en la UI
                if (this.uiManager && this.uiManager.equipoTexto) {
                    this.uiManager.equipoTexto.setText('EQUIPO: ' + this.playerTeam);
                }
            }
        }
        
        // Procesar posiciones iniciales de portadrones
        const portadronesAereos = datosPartida.listaPortaDronesAereos;
        const portadronesNavales = datosPartida.listaPortaDronesNavales;
        
        if (portadronesAereos && portadronesNavales) {
            const portadrones = [...portadronesAereos, ...portadronesNavales];
            
            console.log('=== CONFIGURACION DE PORTADRONES ===');
            console.log('Portadrones AEREOS:', portadronesAereos.map(p => {
                const jugId = p.idJugador || p.jugadorId || 'MISSING';
                return `ID=${p.id} jugador=${jugId}`;
            }));
            console.log('Portadrones NAVALES:', portadronesNavales.map(p => {
                const jugId = p.idJugador || p.jugadorId || 'MISSING';
                return `ID=${p.id} jugador=${jugId}`;
            }));
            console.log('Mi playerId:', this.playerId, 'Mi equipo:', this.playerTeam);
            
            // Encontrar el portadrón del jugador
            let miPortadron = null;
            for (let i = 0; i < portadrones.length; i++) {
                const p = portadrones[i];
                const portadronJugadorId = p.idJugador || p.jugadorId;
                const matches = portadronJugadorId === this.playerId;
                if (matches) {
                    console.log(`Comparando portadron ID=${p.id} (equipo=${p.tipoEquipo}) jugador=${portadronJugadorId} con mi ID=${this.playerId}: MATCH`);
                    miPortadron = p;
                    break;
                } else {
                    console.log(`Comparando portadron ID=${p.id} (equipo=${p.tipoEquipo}) jugador=${portadronJugadorId} con mi ID=${this.playerId}: no match`);
                }
            }
            
            // Fallback: buscar por equipo
            if (!miPortadron) {
                console.warn('[WARN] No se encontro portadron por idJugador, intentando por equipo');
                
                if (this.playerTeam === 'AEREO') {
                    for (let i = 0; i < portadronesAereos.length; i++) {
                        const p = portadronesAereos[i];
                        if (!p.idJugador && !p.jugadorId) {
                            miPortadron = p;
                            break;
                        }
                    }
                    if (!miPortadron && portadronesAereos.length > 0) {
                        miPortadron = portadronesAereos[0];
                        console.warn('[WARN] AEREO: Usando primer portadron AEREO como fallback');
                    }
                } else if (this.playerTeam === 'NAVAL') {
                    for (let i = 0; i < portadronesNavales.length; i++) {
                        const p = portadronesNavales[i];
                        if (!p.idJugador && !p.jugadorId) {
                            miPortadron = p;
                            break;
                        }
                    }
                    if (!miPortadron && portadronesNavales.length > 0) {
                        miPortadron = portadronesNavales[0];
                        console.warn('[WARN] NAVAL: Usando primer portadron NAVAL como fallback');
                    }
                }
            }
            
            if (miPortadron) {
                const jugId = miPortadron.jugadorId || miPortadron.idJugador || 'MISSING';
                
                console.log('MI PORTADRON ASIGNADO:', {
                    id: miPortadron.id,
                    equipo: miPortadron.tipoEquipo,
                    jugadorId: jugId,
                    posicion: `(${miPortadron.x}, ${miPortadron.y})`,
                    miEquipo: this.playerTeam,
                    miId: this.playerId
                });
                
                // Validar equipo correcto
                if (miPortadron.tipoEquipo !== this.playerTeam) {
                    console.error('[ERROR] Portadron asignado es del equipo equivocado!');
                    console.error(`   Esperado: ${this.playerTeam}, Asignado: ${miPortadron.tipoEquipo}`);
                }
                
                // Configurar InputManager
                this.inputManager.configurarPortadron(miPortadron.id);
                
                // Centrar cámara
                this.cameras.main.centerOn(miPortadron.x, miPortadron.y);
                console.log('[Camera] Centrada en portadron:', miPortadron.x, miPortadron.y);
            } else {
                console.error('[ERROR] No se encontro portadron para jugador', this.playerId, 'equipo', this.playerTeam);
                console.error('   Portadrones disponibles:', portadrones.map(p => 
                    `ID=${p.id} equipo=${p.tipoEquipo} jugador=${p.idJugador || p.jugadorId}`
                ));
            }
        }
        
        // EntityManager creará las entidades cuando reciba eventos ACTUALIZAR_PARTIDA
        // Backend enviará ACTUALIZAR_PARTIDA poco después de PARTIDA_INICIADA
    }
    
    mostrarVistaImpacto(data) {
        // Pausar el juego actual
        this.scene.pause();
        
        // Extraer información del evento RECIBE_IMPACTO
        const datosImpacto = {
            proyectilTipo: data.tipoProyectil,
            objetivoTipo: data.claseObjetivo,
            objetivoEquipo: data.equipoObjetivo
        };
        
        if (!datosImpacto.proyectilTipo) {
            datosImpacto.proyectilTipo = data.clase;
        }
        if (!datosImpacto.proyectilTipo) {
            datosImpacto.proyectilTipo = 'MISIL';
        }
        
        if (!datosImpacto.objetivoTipo) {
            datosImpacto.objetivoTipo = 'DRON';
        }
        
        if (!datosImpacto.objetivoEquipo) {
            datosImpacto.objetivoEquipo = data.tipoEquipo;
        }
        if (!datosImpacto.objetivoEquipo) {
            datosImpacto.objetivoEquipo = 'AEREO';
        }
        // Lanzar la escena de impacto lateral
        this.scene.launch('ImpactView', datosImpacto);
    }
    
    renderizarMapa(matriz) {
        if (this.mapaYaRenderizado) {
            console.error('[renderizarMapa] LLAMADA DUPLICADA DETECTADA - BLOQUEADA');
            return;
        }
        
        if (!matriz) {
            console.warn('[renderizarMapa] No hay matriz de mapa disponible');
            return;
        }
        if (!Array.isArray(matriz)) {
            console.warn('[renderizarMapa] Matriz no es array');
            return;
        }
        
        const rows = matriz.length;
        let cols = 0;
        if (matriz[0]) {
            cols = matriz[0].length;
        }
        const tileSize = 8;
        this.worldWidth = cols * tileSize;
        this.worldHeight = rows * tileSize;
        
        console.log('[renderizarMapa] === RENDERIZADO UNICO DEL MAPA ===');
        console.log(`[renderizarMapa] Dimensiones: ${rows} filas x ${cols} columnas`);
        console.log(`[renderizarMapa] Tamano del mundo: ${this.worldWidth}x${this.worldHeight} px (tileSize=${tileSize})`);
        
        if (this.mapTiles) {
            this.mapTiles.destroy();
        }
        
        this.mapTiles = this.add.graphics();
        
        const tileColors = {
            0: 0x1e90ff,
            1: 0x228b22,
            2: 0x8b4513
        };
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const tileValue = matriz[i][j];
                if (tileValue !== 0) {
                    const color = tileColors[tileValue];
                    if (color) {
                        this.mapTiles.fillStyle(color, 1.0);
                        this.mapTiles.fillRect(j * tileSize, i * tileSize, tileSize, tileSize);
                    }
                }
            }
        }
        
        console.log(`[renderizarMapa] Actualizando camera bounds a: ${this.worldWidth}x${this.worldHeight}`);
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        if (this.fondoAgua) {
            this.fondoAgua.setSize(this.worldWidth, this.worldHeight);
            this.fondoAgua.setPosition(0, 0);
            this.fondoAgua.setDepth(-1);
        }
        
        console.log(`[renderizarMapa] Mapa renderizado completo`);
    }

    crearBotonSalida() {
        // Position button at bottom right corner
        const exitButton = this.add.dom(this.scale.width - 150, this.scale.height - 50).createFromHTML(`
            <button id="exitBtn" style="
                padding: 14px 28px;
                border-radius: 25px;
                border: none;
                background: linear-gradient(90deg, #e1f1f158, #e1f1f19a);
                color: #000;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.25s ease;
                box-shadow: 0 0 10px rgba(18,18,18,0.83);
            ">Salir y guardar</button>
        `);
        
        const btn = exitButton.node.querySelector('#exitBtn');
        
        // Efectos de hover del botón
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
        
        exitButton.addListener('click');
        exitButton.on('click', () => {
            console.log('Botón de salida presionado');
            this.scene.start('GameOver');
        });
        
        exitButton.setScrollFactor(0);
        this.exitButton = exitButton;
    }

    update(time, delta) {
        // Delegar todo el input al InputManager
        if (this.inputManager) {
            this.inputManager.update();
        }
        
        // DEBUG: Validar bounds de la cámara
        if (this.mapaYaRenderizado && this.worldWidth && this.worldHeight && !this.boundsWarningShown) {
            const currentBounds = this.cameras.main.getBounds();
            if (currentBounds.width !== this.worldWidth || currentBounds.height !== this.worldHeight) {
                console.error('[Game.update] CAMERA BOUNDS MODIFICADOS INESPERADAMENTE!');
                console.error(`  Esperado: ${this.worldWidth}x${this.worldHeight}`);
                console.error(`  Actual: ${currentBounds.width}x${currentBounds.height}`);
                this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
                this.boundsWarningShown = true;
            }
        }
        
        // Seguir al elemento activo con la cámara
        if (this.inputManager && this.inputManager.elementoActivo) {
            const elementoActivo = this.entityManager.getUnidad(this.inputManager.elementoActivo);
            if (elementoActivo) {
                // VALIDACIÓN: Solo seguir elementos que pertenecen al jugador
                let elementoJugadorId = elementoActivo.idJugador;
                if (!elementoJugadorId) {
                    elementoJugadorId = elementoActivo.jugadorId;
                }
                
                if (elementoJugadorId === this.playerId) {
                    // Seguir suavemente (lerp ya configurado en create)
                    this.cameras.main.startFollow(elementoActivo, false);
                } else {
                    console.error(`[ERROR] [Game.update] Intentando seguir elemento enemigo! ID=${this.inputManager.elementoActivo} jugador=${elementoJugadorId} (yo soy ${this.playerId})`);
                    // No seguir elementos enemigos - resetear a portadron del jugador
                    if (this.inputManager.idPortadron !== null && this.inputManager.idPortadron !== undefined) {
                        this.inputManager.elementoActivo = this.inputManager.idPortadron;
                        this.inputManager.vistaActual = 'PORTADRON';
                        if (this.inputManager.uiManager) {
                            this.inputManager.uiManager.actualizarVista('PORTADRON');
                        }
                    }
                }
            }
        }
    }
}
