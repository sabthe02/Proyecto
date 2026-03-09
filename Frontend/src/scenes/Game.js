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
        
        // Game inicializado
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
        
        // Cargar sprites laterales para ImpactView
        this.load.image('dron_aereo_lateral', 'drones/AD_lateral.svg');
        this.load.image('dron_naval_lateral', 'drones/ND_lateral.svg');
        this.load.image('portadrones_aereo_lateral', 'portadrones/PDAreo_lateral.png');
        this.load.image('portadrones_naval_lateral', 'portadrones/PDNaval_lateral.png');
        this.load.image('damage_overlay', 'daño/playerShip1_damage2.png');
        
        // Cargar frames de animación de fuego para efectos de explosión
        for (let i = 0; i < 20; i++) {
            const frameNum = String(i).padStart(2, '0');
            this.load.image(`fire${frameNum}`, `effectos/fire${frameNum}.png`);
        }
    }

    create() {
                sessionStorage.setItem('playerTeam', this.playerTeam);
                sessionStorage.setItem('playerId', this.playerId);
                sessionStorage.setItem('nickname', this.nickname);
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
        
        // Creando escena
        
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
        this.elementoActivoWarningShown = false; // Flag para control de logs
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

        // TEST SOLO, BORRAR LUEGO!!!!!!: Vista lateral con tecla 'i' - mostrar impacto según equipo del jugador
        this.input.keyboard.on('keydown-I', () => {
            console.log('Tecla I presionada - Disparando vista de impacto para equipo:', this.playerTeam);
            
            // Determinar datos según el equipo del jugador
            let datosTest;
            let objetivoTipo;
            if (Math.random() > 0.5) {
                objetivoTipo = 'DRON';
            } else {
                objetivoTipo = 'PORTADRON';
            }

            if (this.playerTeam === 'AEREO') {
                // Equipo Aéreo: es atacado por misiles navales (horizontal izquierda → derecha)
                datosTest = {
                    proyectilTipo: 'MISIL',
                    objetivoTipo: objetivoTipo,
                    objetivoEquipo: 'AEREO',
                    dañoInfligido: 150,
                    angulo: 0,
                    targetPosicion: { x: 500, y: 500 },
                    proyectilPosicion: { x: 100, y: 500 }
                };
            } else {
                // Equipo Naval: es atacado por bombas aéreas (caen desde arriba)
                datosTest = {
                    proyectilTipo: 'BOMBA',
                    objetivoTipo: objetivoTipo,
                    objetivoEquipo: 'NAVAL',
                    dañoInfligido: 200,
                    angulo: 270,
                    targetPosicion: { x: 500, y: 500 },
                    proyectilPosicion: { x: 500, y: 100 }
                };
            }
            
            console.log('Lanzando ImpactView con datos:', datosTest);
            this.mostrarVistaImpacto(datosTest);
        });
        
        // Asegurar que el canvas tiene foco para capturar eventos de teclado
        if (this.game.canvas) {
            this.game.canvas.focus();
            console.log('Canvas enfocado para capturar eventos de teclado');
        }
        
        // Escuchar cuando la escena se reanuda (después de ImpactView) para restaurar foco
        this.events.on('resume', () => {
            console.log('Escena reanudada - restaurando foco del canvas y teclado');
            
            // Restaurar foco del canvas
            if (this.game.canvas) {
                this.game.canvas.focus();
                // Forzar foco con un pequeño delay para asegurar que el navegador lo procese
                setTimeout(() => {
                    this.game.canvas.focus();
                }, 50);
            }
            
            // Asegurar que el teclado esté activo y capturando globalmente
            if (this.input.keyboard) {
                this.input.keyboard.enabled = true;
                this.input.keyboard.enableGlobalCapture();
                console.log('Teclado reactivado y captura global habilitada');
            }
            
            // Re-habilitar input manager si tiene método de reactivación
            if (this.inputManager && this.inputManager.reactivar) {
                this.inputManager.reactivar();
            }
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
        
        // Escuchar APLICAR_DANO para mostrar vista lateral de impacto
        // EntityManager también escucha esto, pero Game.js necesita el mostrarVistaImpacto
        this.events.on('APLICAR_DANO', (data) => {
            console.log('APLICAR_DANO recibido:', data);
            // EntityManager maneja el daño visual, aquí solo verificamos si mostrar ImpactView
            // (EntityManager llamará a mostrarVistaImpacto si es necesario)
        });
        
        // Escuchar disparo fallido (sin munición)
        this.events.on('DISPARO_FALLIDO', () => {
            this.mostrarMensajeError('Sin munición — recargá primero');
        });

        // Escuchar respuesta de guardar partida
        this.events.on('PARTIDA_GUARDADA_EXITOSO', (data) => {
            console.log('PARTIDA_GUARDADA_EXITOSO:', data);
            this.mostrarMensajeExito('Partida guardada con éxito');
            // Redirigir a GameChoice después de 1.5 segundos
            this.time.delayedCall(1500, () => {
                this.scene.start('GameChoice');
            });
        });
        
        this.events.on('PARTIDA_GUARDADA_FALLIDO', (data) => {
            console.error('PARTIDA_GUARDADA_FALLIDO:', data);
            const mensaje = data.mensaje || data.Mensaje || 'Error al guardar la partida, volver a intentar';
            this.mostrarMensajeError(mensaje);
        });
        
        // Escuchar respuesta de finalizar partida
        this.events.on('PARTIDA_FINALIZADA_EXITOSO', (data) => {
            console.log('PARTIDA_FINALIZADA_EXITOSO:', data);
            // Redirigir a GameOver con resultado empate
            this.scene.start('GameOver', { result: 'opponent_left' });
        });
        
        this.events.on('PARTIDA_FINALIZADA_FALLIDO', (data) => {
            console.error('PARTIDA_FINALIZADA_FALLIDO:', data);
            const mensaje = data.mensaje || data.Mensaje || 'Error al finalizar la partida';
            this.mostrarMensajeError(mensaje);
        });
        
        // Escuchar mensajes de ERROR genéricos del backend
        this.events.on('ERROR', (data) => {
            console.error('ERROR del backend:', data);
            const mensaje = data.mensaje || data.Mensaje || 'Error en la operación';
            this.mostrarMensajeError(mensaje);
        });
        
        // Escuchar respuesta de recarga de dron
        this.events.on('RECARGA_PROCESADA', (data) => {
            console.log('RECARGA_PROCESADA:', data);
            // No mostrar mensaje - el feedback visual es el estado CARGANDO del dron
        });
        
        this.events.on('RECARGA_FALLIDA', (data) => {
            console.warn('RECARGA_FALLIDA:', data);
            const mensaje = data.mensaje || 'No se pudo recargar. Acércate al portadron.';
            this.mostrarMensajeError(mensaje);
        });
        
        // Escuchar mensaje de FIN_PARTIDA del backend
        this.events.on('FIN_PARTIDA', (data) => {
            console.log('FIN_PARTIDA recibido:', data);
            const ganadorId = data.ganador;
            
            // Determinar resultado para el jugador local
            let result;
            if (ganadorId === 'EMPATE') {
                result = 'tie';
            } else if (ganadorId === this.playerId) {
                result = 'win';
            } else {
                result = 'loss';
            }
            
            console.log('Transición a GameOver con resultado:', result);
            this.scene.start('GameOver', { result: result });
        });
        
        // ACTUALIZAR_PARTIDA ya lo escuchan EntityManager y UIManager
        // InputManager maneja todo el input (clic y tecla R)
    }

    procesarPartidaIniciada(datosPartida) {
        // Procesando estado inicial
        
        // Renderizar tiles del mapa desde la matriz
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
                // Jugador encontrado
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
            let encontrado = false;
            for (let i = 0; i < portadrones.length && !encontrado; i++) {
                const p = portadrones[i];
                const portadronJugadorId = p.idJugador || p.jugadorId;
                const portadronTipo = p.tipoEquipo || p.tipo; // DTOs usan 'tipo', ACTUALIZAR_PARTIDA usa 'tipoEquipo'
                const matches = portadronJugadorId === this.playerId;
                if (matches) {
                    console.log(`Comparando portadron ID=${p.id} (equipo=${portadronTipo}) jugador=${portadronJugadorId} con mi ID=${this.playerId}: MATCH`);
                    miPortadron = p;
                    miPortadron.tipoEquipo = portadronTipo; // Normalizar el campo
                    encontrado = true;
                } else {
                    console.log(`Comparando portadron ID=${p.id} (equipo=${portadronTipo}) jugador=${portadronJugadorId} con mi ID=${this.playerId}: no match`);
                }
            }
            
            // Fallback: buscar por equipo
            if (!miPortadron) {
                console.warn('No se encontro portadron por idJugador, intentando por equipo');
                
                if (this.playerTeam === 'AEREO') {
                    let encontradoAereo = false;
                    for (let i = 0; i < portadronesAereos.length && !encontradoAereo; i++) {
                        const p = portadronesAereos[i];
                        if (!p.idJugador && !p.jugadorId) {
                            miPortadron = p;
                            encontradoAereo = true;
                        }
                    }
                    if (!miPortadron && portadronesAereos.length > 0) {
                        miPortadron = portadronesAereos[0];
                        console.warn('AEREO: Usando primer portadron AEREO como fallback');
                    }
                } else if (this.playerTeam === 'NAVAL') {
                    let encontradoNaval = false;
                    for (let i = 0; i < portadronesNavales.length && !encontradoNaval; i++) {
                        const p = portadronesNavales[i];
                        if (!p.idJugador && !p.jugadorId) {
                            miPortadron = p;
                            encontradoNaval = true;
                        }
                    }
                    if (!miPortadron && portadronesNavales.length > 0) {
                        miPortadron = portadronesNavales[0];
                        console.warn('NAVAL: Usando primer portadron NAVAL como fallback');
                    }
                }
            }
            
            if (miPortadron) {
                const jugId = miPortadron.jugadorId || miPortadron.idJugador || 'MISSING';
                
                // Normalizar equipo a mayusculas para comparacion
                let equipoPortadron = '';
                if (miPortadron.tipoEquipo) {
                    equipoPortadron = miPortadron.tipoEquipo.toUpperCase();
                }
                
                let miEquipo = '';
                if (this.playerTeam) {
                    miEquipo = this.playerTeam.toUpperCase();
                }
                
                if (equipoPortadron !== miEquipo) {
                    console.error('Portadron del equipo incorrecto:', equipoPortadron, 'esperado:', miEquipo);
                }
                
                // Configurar InputManager
                this.inputManager.configurarPortadron(miPortadron.id);
                
                // Centrar cámara
                this.cameras.main.centerOn(miPortadron.x, miPortadron.y);
            } else {
                console.error('No se encontro portadron para jugador', this.playerId, 'equipo', this.playerTeam);
                console.error('   Portadrones disponibles:', portadrones.map(p => 
                    `ID=${p.id} equipo=${p.tipoEquipo} jugador=${p.idJugador || p.jugadorId}`
                ));
            }
        }
        
        // Convert DTO data from PARTIDA_INICIADA into ACTUALIZAR_PARTIDA format
        // so EntityManager can create entities immediately (avoids timing issue
        // where backend's ACTUALIZAR_PARTIDA arrives before Game scene is ready)
        const elementos = [];
        const todasPortadrones = [
            ...(portadronesAereos || []),
            ...(portadronesNavales || [])
        ];
        for (const p of todasPortadrones) {
            const tipoEquipo = (p.tipo || p.tipoEquipo || 'NAVAL').toUpperCase();
            const idJugador = p.jugadorId || p.idJugador || null;
            // Add portadron element
            const listaDrones = [];
            const drones = p.listaDrones || [];
            for (const d of drones) {
                listaDrones.push({ id: d.id, estado: d.estado });
            }
            elementos.push({
                id: p.id, x: p.x, y: p.y, z: p.z || 0,
                angulo: p.angulo || 0, vida: p.vida, vidaMax: p.vida, estado: p.estado,
                idJugador: idJugador, clase: 'PORTADRON',
                tipoEquipo: tipoEquipo, listaDrones: listaDrones
            });
            // Add drone elements
            for (const d of drones) {
                const dronTipoEquipo = (d.tipo || tipoEquipo).toUpperCase();
                elementos.push({
                    id: d.id, x: d.x, y: d.y, z: d.z || 0,
                    angulo: d.angulo || 0, vida: d.vida, estado: d.estado,
                    idJugador: idJugador, clase: 'DRON',
                    tipoEquipo: dronTipoEquipo, bateria: d.bateria || 0,
                    municionDisponible: d.municionDisponible || 0,
                    tipoMunicion: d.tipoMunicion || (dronTipoEquipo === 'AEREO' ? 'BOMBA' : 'MISIL')
                });
            }
        }
        if (elementos.length > 0 && this.entityManager) {
            console.log(`Emitiendo ACTUALIZAR_PARTIDA inicial con ${elementos.length} elementos desde PARTIDA_INICIADA`);
            this.events.emit('ACTUALIZAR_PARTIDA', { tipo: 'ACTUALIZAR_PARTIDA', datos: { elementos: elementos } });
        }
    }
    
    mostrarVistaImpacto(data) {
        console.log('mostrarVistaImpacto() llamado con data:', data);
        
        // Pausar el juego actual
        this.scene.pause();
        console.log('Escena pausada');
        
        // Extraer información - manejar tanto RECIBE_IMPACTO como datos de EntityManager
        const datosImpacto = {
            proyectilTipo: data.proyectilTipo || data.tipoProyectil || data.clase || 'MISIL',
            objetivoTipo: data.objetivoTipo || data.claseObjetivo || 'DRON',
            objetivoEquipo: data.objetivoEquipo || data.equipoObjetivo || data.tipoEquipo || 'AEREO',
            dañoInfligido: data.dañoInfligido || data.dano || 0,
            angulo: data.angulo,
            targetPosicion: data.targetPosicion,
            proyectilPosicion: data.proyectilPosicion
        };
        
        console.log('Lanzando ImpactView con datos procesados:', datosImpacto);
        
        // Lanzar la escena de impacto lateral
        try {
            this.scene.launch('ImpactView', datosImpacto);
            console.log('ImpactView lanzado exitosamente');
        } catch (error) {
            console.error('ERROR al lanzar ImpactView:', error);
            // Reanudar el juego si hubo error
            this.scene.resume();
        }
    }
    
    renderizarMapa(matriz) {
        if (this.mapaYaRenderizado) {
            console.error('LLAMADA DUPLICADA DETECTADA - BLOQUEADA');
            return;
        }
        
        if (!matriz) {
            console.warn('No hay matriz de mapa disponible');
            return;
        }
        if (!Array.isArray(matriz)) {
            console.warn('Matriz no es array');
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
        
        // Renderizando mapa unico
        
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
        
        // Actualizando camera bounds
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        
        // Actualizar fondo de agua para cubrir todo el mapa
        if (this.fondoAgua) {
            // Para TileSprite, necesitamos actualizar width y height directamente
            this.fondoAgua.width = this.worldWidth;
            this.fondoAgua.height = this.worldHeight;
            this.fondoAgua.setPosition(0, 0);
            this.fondoAgua.setOrigin(0, 0);
            this.fondoAgua.setDepth(-1);
            // Fondo actualizado
        }
        
        // Asegurar que la cámara cubra todo el mundo
        const physics = this.physics.world;
        if (physics) {
            physics.setBounds(0, 0, this.worldWidth, this.worldHeight);
        }
        
        // Mapa renderizado
    }

    crearBotonSalida() {
        // Posionar el botón en la esquina inferior derecha con un margen
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
            ">Guardar y salir</button>
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
            console.log('Botón guardar y salir presionado');
            this.guardarYSalir();
        });
        
        exitButton.setScrollFactor(0);
        this.exitButton = exitButton;
    }

    guardarYSalir() {
        // Enviar mensaje al backend para guardar la partida
        const idJugador = parseInt(this.playerId);
        const mensaje = 'Jugador guardó y salió de la partida';
        
        if (!this.network) {
            console.error('NetworkManager no disponible');
            this.mostrarMensajeError('Error: conexión no disponible');
            return;
        }
        
        const enviado = this.network.guardarPartida(idJugador, mensaje);
        
        if (!enviado) {
            console.warn('No se pudo enviar GUARDAR_PARTIDA');
            this.mostrarMensajeError('Error: no se pudo enviar la solicitud');
        } else {
            console.log('GUARDAR_PARTIDA enviado - idJugador:', idJugador);
        }
    }

    mostrarMensajeExito(texto) {
        const mensaje = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            texto,
            {
                fontSize: '32px',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 6,
                backgroundColor: '#000000cc',
                padding: { x: 20, y: 10 }
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10000);
        
        // Animación de aparición
        mensaje.setAlpha(0);
        this.tweens.add({
            targets: mensaje,
            alpha: 1,
            duration: 500,
            ease: 'Power2'
        });
    }

    mostrarMensajeError(texto) {
        const mensaje = this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            texto,
            {
                fontSize: '24px',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                backgroundColor: '#000000cc',
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(10000);
        
        // Animación de aparición y desaparición
        mensaje.setAlpha(0);
        this.tweens.add({
            targets: mensaje,
            alpha: 1,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(3000, () => {
                    this.tweens.add({
                        targets: mensaje,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => mensaje.destroy()
                    });
                });
            }
        });
    }

    update(time, delta) {
        // Delegar todo el input al InputManager
        if (this.inputManager) {
            this.inputManager.update();
        }
    
        
        // Seguir al elemento activo con la cámara
        if (this.inputManager && this.inputManager.elementoActivo !== null && this.inputManager.elementoActivo !== undefined) {
            const elementoActivo = this.entityManager.getUnidad(this.inputManager.elementoActivo);
            if (elementoActivo) {
                // Solo seguir elementos que pertenecen al jugador
                let elementoJugadorId = elementoActivo.idJugador;
                if (!elementoJugadorId) {
                    elementoJugadorId = elementoActivo.jugadorId;
                }
                
                if (String(elementoJugadorId) === String(this.playerId)) {
                    // Verificar que la cámara está disponible antes de usarla
                    if (this.cameras && this.cameras.main) {
                        // Seguir suavemente
                        this.cameras.main.startFollow(elementoActivo, false);
                    } else {
                        console.warn(' Cámara no disponible (probablemente escena pausada)');
                    }
                } else {
                    console.error(`Intentando seguir elemento enemigo! ID=${this.inputManager.elementoActivo} jugador=${elementoJugadorId} (yo soy ${this.playerId})`);
                    // No seguir elementos enemigos - resetear a portadron del jugador
                    if (this.inputManager.idPortadron !== null && this.inputManager.idPortadron !== undefined) {
                        this.inputManager.elementoActivo = this.inputManager.idPortadron;
                        this.inputManager.vistaActual = 'PORTADRON';
                        if (this.inputManager.uiManager) {
                            this.inputManager.uiManager.actualizarVista('PORTADRON');
                        }
                    }
                }
            } else {
                // Elemento activo no existe aún en EntityManager
                // Esto es normal al inicio - esperar a que llegue ACTUALIZAR_PARTIDA
                if (!this.elementoActivoWarningShown) {
                    console.warn(`[Game.update] Esperando que elemento ${this.inputManager.elementoActivo} sea creado por EntityManager...`);
                    this.elementoActivoWarningShown = true;
                }
            }
        }
    }
}
