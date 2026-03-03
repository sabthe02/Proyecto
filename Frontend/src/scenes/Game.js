export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        if (data.team) {
            this.playerTeam = data.team;
        } else {
            this.playerTeam = 'NAVAL';
        }
        
        if (data.playerId) {
            this.playerId = data.playerId;
        } else if (sessionStorage.getItem('playerId')) {
            this.playerId = sessionStorage.getItem('playerId');
        } else {
            this.playerId = '';
        }
        
        if (data.nickname) {
            this.nickname = data.nickname;
        } else {
            this.nickname = 'Player';
        }
        this.jugadoresCount = 0;
        this.ownPortadronId = null;
        this.ownPortadronKey = null;
        this.idPartida = null;
        this.controlMode = 'PORTADRONES';
        this.activeDron = null;
        this.lastSelectedDronId = null;
        this.unidadesRemotas = new Map();
        this.elementosEstado = new Map();
        this.elementosBackendEstado = new Map();
        this.elementosSprites = new Map();
        this.elementosLabels = new Map();
        this.elementosLifebars = new Map();
        this.elementosBateriabars = new Map();
        this.proyectilesEstado = new Map();
        this.proyectilesSprites = new Map();
        this.partidaInicial = null;
        this.pendingMoveRequest = null;
        this.pendingShotRequest = null;
        this.dronesActivados = new Set();
        this.visionRangeAereo = 250;
        this.visionRangeNaval = 125;
        this.portadronBajoAtaqueHasta = 0;
        this.colorIndicadorPortadronNormal = 0xfff066;
        this.colorIndicadorPortadronAtaque = 0xff3b30;
        this.portadronDirectionArrow = null;
        this.minimap = null;
        this.pendingRechargeRequest = null;
        this.toastText = null;
        this.lastDeploymentTime = 0; // Debounce para despliegue de drones
        this.pendingDroneDeployment = false; // Bandera para cambiar automáticamente al dron recién desplegado
        this.dronesAnimandoCaida = new Set(); // Rastrear drones reproduciendo animación de muerte
        this.portersAnimandoDestruccion = new Set(); // Rastrear portadores reproduciendo animación de destrucción
        this.gameOverTriggered = false; // Prevenir múltiples activaciones de fin de juego
        this.lastUpdateLog = 0; // Para debug: rastrear si update() está ejecutándose
        if (data && data.partidaInicial) {
            this.partidaInicial = data.partidaInicial;
        }
        this.visionRange = this.visionRangeNaval;
        if (this.playerTeam === 'AEREO') {
            this.visionRange = this.visionRangeAereo;
        }
    }

    preload() {
        this.load.path = 'assets/';
        this.load.image('texturaAgua', 'background/background.jpg');
        this.load.image('portadron_naval', 'portadrones/portadronNaval.png');
        this.load.image('portadron_aereo', 'portadrones/PortadronAereo.png');
        this.load.image('dron_aereo', 'drones/dronAereo.svg');
        this.load.image('dron_naval', 'drones/dronNaval.svg');
        this.load.image('proyectil_misil', 'effectos/speed.png');
        this.load.image('proyectil_bomba', 'effectos/fire00.png');
        
        // Cargar todos los fotogramas de animación de fuego para efectos de destrucción
        for (let i = 0; i < 20; i++) {
            const frameNum = String(i).padStart(2, '0');
            this.load.image(`fire${frameNum}`, `effectos/fire${frameNum}.png`);
        }
    }

    create() {
        console.log("Visualizador de Batalla iniciado");
        
        // ADVERTENCIA CRITICA: PROBLEMA DE SALUD DEL PORTADRON
        console.warn('%cPROBLEMA DE ESCALADO DE SALUD: Los portadrones mueren mas rapido de lo esperado', 'color: #ff0000; font-size: 14px; font-weight: bold');
        console.warn('El frontend muestra: AEREO=1000 HP, NAVAL=800 HP (escalado para UI)');
        console.warn('El backend usa: TODOS LOS PORTADRONES=100 HP maximo (autoritativo)');
        console.warn('Resultado: Los portadrones mueren en 2 impactos porque el backend verifica salud contra 100, NO 1000/800');
        console.warn('SOLUCION REQUERIDA: El backend debe usar maxHealth=1000 para AEREO, maxHealth=800 para NAVAL');

        this.lastMouseMoveSentAt = 0;

        // fondo de agua uniforme (sin tiling para evitar cortes visuales)
        this.fondoAgua = this.add.image(0, 0, 'texturaAgua');
        this.fondoAgua.setOrigin(0, 0);
        this.fondoAgua.setDisplaySize(window.innerWidth, window.innerHeight);
        this.fondoAgua.setDepth(-2);
        this.fondoAgua.setScrollFactor(0);
        this.fondoAgua.setTint(0x2266cc);

        // capa de niebla (todo negro) encima del agua
        this.fog = this.add.graphics();
        this.fog.fillStyle(0x000000, 1);
        this.fog.fillRect(0, 0, this.scale.width, this.scale.height);
        this.fog.setScrollFactor(0);
        this.fog.setDepth(9000);

        // círculo que servirá como máscara (área visible)
        this.visionCircle = this.add.graphics();
        this.visionCircle.setScrollFactor(0);
        this.visionCircle.setVisible(false);
        this.visionMask = this.visionCircle.createGeometryMask();
        this.visionMask.invertAlpha = true;
        this.fog.setMask(this.visionMask);

        this.misDrones = this.physics.add.group();
        this.proyectiles = this.physics.add.group();
        this.cursors = this.input.keyboard.createCursorKeys();
        this.dronesActivosOrdenados = []; // Lista ordenada de drones activos para ciclado
        this.currentDronIndex = -1; // Índice actual en el ciclo de drones

        
        this.configurarUnidadSegunEquipo();

      
        if (this.unit) {
            this.cameras.main.startFollow(this.unit, true, 0.05, 0.05);
        }

        // pintura inicial de la niebla de guerra
        this.dibujarVision();

        
        this.input.keyboard.on('keydown-SPACE', () => {
            // Ciclo: PORTADRONES → DRON1 → DRON2 → ... → PORTADRONES
            // BARRA ESPACIADORA SOLO CICLA - NUNCA DESPLIEGA
            if (this.controlMode === 'DRON') {
                // Si estamos en un dron, intentar ir al siguiente dron o volver al porter
                if (!this.ciclarAlSiguienteDron()) {
                    this.volverAlPortadron();
                }
                return;
            }

            // Si estamos en PORTADRONES, intentar ir al primer dron activo
            if (this.controlMode === 'PORTADRONES') {
                if (!this.ciclarAlPrimerDron()) {
                    console.log('Ciclo: Sin drones disponibles para ciclar, permaneciendo en porter');
                }
            }
        });

        // Tecla 'R' para activar recarga cuando se controla un dron
        this.input.keyboard.on('keydown-R', () => {
            console.log('Recarga: ========== TECLA R PRESIONADA ==========');
            console.log('Recarga: Modo actual:', this.controlMode);
            let activeDronStatus;
            if (this.activeDron) {
                activeDronStatus = 'existe';
            } else {
                activeDronStatus = 'NULO';
            }
            console.log('Recarga: Dron activo:', activeDronStatus);
            
            if (this.controlMode === 'DRON' && this.activeDron) {
                const porta = this.obtenerEstadoPortadronPropio();
                if (porta) {
                    console.log('Recarga: Portadron no encontrado, llamando solicitarRecargaDron');
                    this.solicitarRecargaDron(porta.id);
                } else {
                    console.log('Recarga: Portadron no encontrado');
                }
            } else {
                console.log('Recarga: No esta en modo DRON o no hay dron activo');
            }
        });

        // recibir actualizaciones desde el servidor (algunos mensajes ya se escuchan en el menú, re‑usamos)
        this.socket = window.gameSocket;
        if (this.socket) {
            this.socket.onmessage = (evt) => {
                try {
                    const msg = JSON.parse(evt.data);
                    // console.log('[Game] mensaje servidor', msg);
                    switch (msg.tipo) {
                        case 'PARTIDA_INICIADA':
                            // puede contener el estado inicial de la partida, lanzamos la
                            // misma función que para actualizaciones continuas
                            this.idPartida = msg.datos?.idPartida || this.idPartida;
                            if (msg.datos) {
                                this.procesarPartidaIniciada(msg.datos);
                            }
                            break;
                        case 'ACTUALIZAR_PARTIDA':
                            this.actualizarRealidad(msg.datos);
                            // Si acabamos de desplegar un dron y todavía estamos en modo porter, cambiar a él
                            if (this.pendingDroneDeployment && this.controlMode === 'PORTADRONES') {
                                console.log('Despliegue: Auto-cambiando al dron recien desplegado despues de la actualizacion');
                                setTimeout(() => {
                                    const success = this.ciclarAlUltimoDron();
                                    if (success) {
                                        console.log('Despliegue: Cambio exitoso al nuevo dron');
                                        this.pendingDroneDeployment = false;
                                    } else {
                                        console.log('Despliegue: Fallo al cambiar al nuevo dron, se reintentara en la proxima actualizacion');
                                    }
                                }, 100);
                            }
                            // Verificar condición de fin de juego después de cada actualización
                            if (!this.gameOverTriggered) {
                                this.checkGameOverCondition();
                            }
                            break;
                        case 'MOVIMIENTO_PROCESADO':
                            this.confirmarMovimientoPendiente();
                            break;
                        case 'DISPARO_PROCESADO':
                            console.log('Disparo: Disparo confirmado por el servidor');
                            this.confirmarDisparoPendiente();
                            // Backend puede enviar duración del vuelo del proyectil
                            const duracionBackend = msg.duracion || msg.tiempoVuelo || null;
                            this.crearProyectilTemporal(duracionBackend);
                            break;
                        case 'MOVIMIENTO_FALLIDO':
                            this.rechazarMovimientoPendiente(msg);
                            break;
                        case 'ERROR':
                            this.rechazarMovimientoPendiente(msg);
                            this.rechazarDisparoPendiente(msg);
                            console.warn('Juego: error servidor', msg.mensaje || msg);
                            break;
                        case 'DISPARO_FALLIDO':
                            this.rechazarDisparoPendiente(msg);
                            break;
                        case 'JUGADOR_DESCONECTADO':
                        case 'OPONENTE_SALIO':
                            // Backend manda ID del jugador desconectado
                            let disconnectedPlayerId;
                            if (msg.playerId) {
                                disconnectedPlayerId = msg.playerId;
                            } else if (msg.jugadorId) {
                                disconnectedPlayerId = msg.jugadorId;
                            } else {
                                disconnectedPlayerId = msg.idJugador;
                            }
                            console.log('Desconexion: Jugador desconectado:', disconnectedPlayerId, 'Jugador actual:', this.playerId);
                            
                            // Solo mostrar pantalla de empate a quien no se desconectó sin guardar
                            if (disconnectedPlayerId && String(disconnectedPlayerId) !== String(this.playerId)) {
                                if (!this.gameOverTriggered) {
                                    this.gameOverTriggered = true;
                                    console.log('FinDeJuego: Oponente desconectado - EMPATE');
                                    setTimeout(() => {
                                        this.transitionToGameOver('opponent_left');
                                    }, 1000);
                                }
                            } else if (!disconnectedPlayerId) {
                                // Si backend no manda el id, se asume que el oponente se desconectó (caso de desconexión abrupta sin guardar)
                                if (!this.gameOverTriggered) {
                                    this.gameOverTriggered = true;
                                    console.log('FinDeJuego: Jugador desconectado (sin ID provisto) - asumiendo oponente se fue');
                                    setTimeout(() => {
                                        this.transitionToGameOver('opponent_left');
                                    }, 1000);
                                }
                            }
                            break;
                        case 'RECARGADO_EXITOSO':
                            console.log(`%cRecarga: Backend confirmo RECARGADO_EXITOSO a las ${new Date().toLocaleTimeString()}`, 'color: #00ff00; font-weight: bold', msg);
                            this.confirmarRecargaPendiente(msg);
                            break;
                        case 'RECARGADO_FALLIDO':
                            console.error(`%cRecarga: Backend rechazo RECARGADO_FALLIDO a las ${new Date().toLocaleTimeString()}`, 'color: #ff0000; font-weight: bold', msg);
                            this.rechazarRecargaPendiente(msg);
                            break;
                        case 'DRON_DESPLEGADO_EXITOSO':
                            this.mostrarMensajeTemporal('Dron desplegado', 1500, '#d6ffd6');
                            // Establecer bandera para cambiar automáticamente al dron recién desplegado después de la siguiente actualización
                            this.pendingDroneDeployment = true;
                            console.log('Despliegue: Despliegue exitoso, cambiara automaticamente en la proxima actualizacion');
                            // Timeout de seguridad: limpiar bandera después de 3 segundos si no se limpia con un cambio exitoso
                            setTimeout(() => {
                                if (this.pendingDroneDeployment) {
                                    console.log('Despliegue: Tiempo de espera de cambio automatico, limpiando bandera');
                                    this.pendingDroneDeployment = false;
                                }
                            }, 3000);
                            break;
                        case 'DRON_DESPLEGADO_FALLIDO':
                            this.mostrarMensajeTemporal(msg.mensaje || 'No hay drones disponibles', 1800, '#ffd6d6');
                            break;
                        default:
                            break;
                    }
                } catch (e) {
                    console.warn('Juego: error parseando mensaje', e);
                }
            };
        }

        this.input.on('pointerdown', (pointer, gameObjects) => {
            console.log('Clic: Clic de raton detectado', {
                controlMode: this.controlMode,
                hasActiveDron: !!this.activeDron,
                gameObjectsCount: gameObjects?.length || 0
            });

            // Si estamos controlando el portadrones
            if (this.controlMode === 'PORTADRONES') {
                // Todo clic en modo portadrones = desplegar nuevo dron
                // La recarga ocurre automáticamente cuando los drones regresan a la proximidad del portadrones
                console.log('Clic: Modo portadrones: desplegando nuevo dron');
                this.solicitarDesplegarDron();
                return;
            }
            
            if (this.controlMode !== 'DRON' || !this.activeDron) {
                console.log('Clic: BLOQUEADO: No esta en modo DRON o no hay dron activo');
                return;
            }

            // Chequear si se hizo clic en el portadrones propio - activar recarga en lugar de disparar
            const portaPropioClickeado = this.obtenerPortadronPropioClickeado(gameObjects);
            if (portaPropioClickeado) {
                console.log('Clic: Se hizo clic en el portadrones propio - activando recarga en lugar de disparar');
                const porta = this.obtenerEstadoPortadronPropio();
                if (porta) {
                    this.solicitarRecargaDron(porta.id);
                } else {
                    console.warn('Clic: Se hizo clic en el portadrones propio pero no se encontro en el estado');
                }
                return; // No disparar al propio portador!
            }

            // Chequear - bloquear disparo para prevenir fuego amigo
            let clickedOwnNonPorterUnit = false;
            if (Array.isArray(gameObjects) && gameObjects.length > 0) {
                console.log('Clic: Procesando', gameObjects.length, 'objetos clickeados');
                
                const clickedElements = gameObjects
                    .filter(obj => obj && obj.getData)
                    .map(obj => {
                        const elementId = obj.getData('elementId');
                        if (!elementId) {
                            console.log('Clic: Objeto no tiene elementId, omitiendo');
                            return null;
                        }
                        
                        let elemento = null;
                        for (const [clave, elem] of this.elementosEstado.entries()) {
                            if (String(elem.id) === String(elementId)) {
                                elemento = elem;
                                break;
                            }
                        }
                        
                        if (!elemento) {
                            const clave = this.buscarClaveBackendExistentePorId(elementId);
                            if (clave) {
                                elemento = this.elementosBackendEstado.get(clave);
                            }
                        }
                        
                        if (!elemento) {
                            console.log('Clic: Elemento', elementId, 'no encontrado en el estado');
                            return null;
                        }
                        
                        const esPropio = this.esElementoPropio(elemento);
                        const result = {
                            id: elementId,
                            clase: elemento.clase,
                            esPropio: esPropio,
                            tipoEquipo: elemento.tipoEquipo,
                            parentPortadronId: elemento.parentPortadronId
                        };
                        
                        console.log('Clic: Elemento mapeado:', result);
                        return result;
                    })
                    .filter(e => e !== null);
                
                console.log('Clic: ===== ARREGLO FINAL DE ELEMENTOS CLICKEADOS =====', clickedElements);
                console.log('Clic: ownPortadronId:', this.ownPortadronId);
                
                // Obtener dron activo ID para explorar si el clic incluye otros drones propios (fuego amigo) pero EXCLUIR el dron activo (se asume que el jugador sabe que está haciendo clic en su dron activo)
                let activeDronId;
                if (this.activeDron && this.activeDron.getData) {
                    activeDronId = this.activeDron.getData('elementId');
                    if (!activeDronId) {
                        activeDronId = this.activeDron.id;
                    }
                } else if (this.activeDron) {
                    activeDronId = this.activeDron.id;
                } else {
                    activeDronId = null;
                }
                console.log('Clic: ID de dron activo (sera excluido del chequeo):', activeDronId);
                
                // Chequear drones propios (pero EXCLUIR el dron activo - no puedes dispararte a ti mismo)
                const ownDrones = clickedElements.filter(e => {
                    const isOwnDrone = e.esPropio && e.clase === 'DRON';
                    let isActiveDron;
                    if (activeDronId !== undefined && activeDronId !== null) {
                        isActiveDron = String(e.id) === String(activeDronId);
                    } else {
                        isActiveDron = false;
                    }
                    
                    // Solo bloquear si es un dron propio Y NO es el activo
                    return isOwnDrone && !isActiveDron;
                });
                
                if (ownDrones.length > 0) {
                    console.log('Clic: Se encontraron OTROS drones propios en el clic (no el activo):', ownDrones);
                    clickedOwnNonPorterUnit = true;
                } else {
                    console.log('Clic: No se encontraron otros drones propios en el clic (seguro para disparar)');
                    clickedOwnNonPorterUnit = false;
                }
            } else {
                console.log('Clic: Se hizo clic en espacio vacio');
            }

            // Bloquear disparo a propios drones para prevenir fuego amigo
            if (clickedOwnNonPorterUnit) {
                console.log('Clic: BLOQUEADO: Se hizo clic en un dron propio. No se puede disparar a unidades amigas');
                this.mostrarMensajeTemporal('¡No puedes disparar a tus propias unidades!', 2000, '#ff6666');
                return;
            }

            // Permitir disparar a enemigos o espacio vacío
            console.log('Clic: Procediendo a emitirDisparo en la posicion del mundo:', {
                worldX: pointer.worldX,
                worldY: pointer.worldY
            });
            this.emitirDisparo(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            this.moverControlConMouse(pointer);
        });

        this.crearInterfazHUD();
        this.crearMiniMapa();
        this.crearIndicadorPortadron();
        this.crearTituloYBotonSalida();
     

        if (this.partidaInicial) {
            this.procesarPartidaIniciada(this.partidaInicial);
        }

        window.addEventListener('resize', () => {
            if (this.fondoAgua) {
                this.fondoAgua.setDisplaySize(window.innerWidth, window.innerHeight);
            }
            if (this.fog) {
                this.fog.clear();
                this.fog.fillStyle(0x000000, 1);
                this.fog.fillRect(0, 0, this.scale.width, this.scale.height);
            }
            if (this.exitButtonDom) {
                this.exitButtonDom.setPosition(this.scale.width - 210, this.scale.height - 40);
            }
            if (this.titleText) {
                this.titleText.setPosition(this.scale.width / 2, 45);
            }
            if (this.txtEquipo) this.txtEquipo.setPosition(20, 95);
            if (this.txtModo) this.txtModo.setPosition(20, 127);
            if (this.txtVida) this.txtVida.setPosition(20, this.scale.height - 92);
            if (this.txtBateria) this.txtBateria.setPosition(20, this.scale.height - 62);
            if (this.txtMunicion) this.txtMunicion.setPosition(20, this.scale.height - 32);
            if (this.toastText) this.toastText.setPosition(this.scale.width / 2, this.scale.height - 130);
            this.posicionarMiniMapa();
            this.actualizarMiniMapa();
            this.dibujarVision();
        });
    }

    configurarUnidadSegunEquipo() {
        if (this.unit) this.unit.destroy();

        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        let skin = 'portadron_naval';
        if (this.playerTeam === 'AEREO') {
            skin = 'portadron_aereo';
        }

        this.unit = this.add.sprite(x, y, skin);
        this.unit.setDisplaySize(180, 80);
        this.unit.setInteractive({ useHandCursor: true });
        this.unit.on('pointerdown', () => {
            if (this.controlMode === 'DRON' && this.activeDron && this.ownPortadronId !== null && this.ownPortadronId !== undefined) {
                this.solicitarRecargaDron(this.ownPortadronId);
                return;
            }
            // Al controlar el portadron, hacer clic en él debería desplegar un nuevo dron
            if (this.controlMode === 'PORTADRONES') {
                console.log('Clic: Se hizo clic en sprite de porter, desplegando dron');
                this.solicitarDesplegarDron();
                return;
            }
            this.seleccionarPortadron(this.unit);
        });
        this.visionRange = this.visionRangeNaval;
        if (this.playerTeam === 'AEREO') {
            this.visionRange = this.visionRangeAereo;
        }

        this.physics.add.existing(this.unit);
        if (this.unit.body) {
            
            this.unit.body.setCollideWorldBounds(false); 
        }
    }

    update() {
        // Debug: Rastrear si update() esta ejecutandose (para detectar congelamientos)
        if (!this.lastUpdateLog || Date.now() - this.lastUpdateLog > 5000) {
            console.log(`%cUPDATE: Bucle de juego ejecutandose - ${new Date().toLocaleTimeString()}`, 'color: #00ff00');
            this.lastUpdateLog = Date.now();
        }
        
        // Chequeo de seguridad: si está en modo DRON pero activeDron está destruido/null, volver al portadron
        if (this.controlMode === 'DRON') {
            if (!this.activeDron || !this.activeDron.active || this.activeDron.alpha <= 0) {
                console.log('Actualizacion: Dron activo es destruido/invalido, regresando al porter');
                this.volverAlPortadron();
                return;
            }
            
            // Verificar si el dron activo está marcado como DESTRUIDO en el estado del backend
            let activeDronId;
            if (this.activeDron && this.activeDron.getData) {
                activeDronId = this.activeDron.getData('elementId');
            } else {
                activeDronId = null;
            }
            if (activeDronId) {
                const clave = this.buscarClaveBackendExistentePorId(activeDronId);
                let dronEstado;
                if (clave) {
                    dronEstado = this.elementosBackendEstado.get(clave);
                } else {
                    dronEstado = null;
                }
                if (dronEstado && dronEstado.estado === 'DESTRUIDO') {
                    console.log('Actualizacion: Dron activo marcado como DESTRUIDO en backend, volviendo al porter');
                    this.volverAlPortadron();
                    return;
                }
            }
        }

        let target;
        if (this.controlMode === 'DRON' && this.activeDron) {
            target = this.activeDron;
        } else {
            target = this.unit;
        }
        
        // Validar que el objetivo existe y tiene posición
        if (!target) {
            console.error('Actualizacion: No se encontro objetivo, intentando recuperacion');
            if (this.controlMode === 'DRON') {
                console.error('Actualizacion: En modo DRON pero sin dron, forzando cambio a PORTER');
                this.volverAlPortadron();
            } else {
                console.error('Actualizacion: En modo PORTER pero sin unidad, recreando');
                this.configurarUnidadSegunEquipo();
                const porterEstado = this.obtenerEstadoPortadronPropio();
                if (porterEstado && this.unit) {
                    this.unit.setPosition(Number(porterEstado.x), Number(porterEstado.y));
                }
            }
            return;
        }
        if (target.x === undefined || target.x === null || !Number.isFinite(target.x)) {
            console.error('Actualizacion: El objetivo tiene posicion invalida', { mode: this.controlMode, x: target.x, y: target.y });
            
            // Intentar recuperación
            if (this.controlMode === 'DRON') {
                console.error('Actualizacion: Posicion de dron invalida, volviendo a PORTER');
                this.volverAlPortadron();
            } else {
                console.error('Actualizacion: Posicion de Porter invalida, corrigiendo desde estado del backend');
                const porterEstado = this.obtenerEstadoPortadronPropio();
                if (porterEstado && Number.isFinite(porterEstado.x) && Number.isFinite(porterEstado.y)) {
                    target.setPosition(Number(porterEstado.x), Number(porterEstado.y));
                    console.log('Actualizacion: Posicion de Porter corregida a:', porterEstado.x, porterEstado.y);
                } else {
                    console.error('Actualizacion: No se puede corregir la posicion del porter, estado del backend invalido');
                    target.setPosition(5000, 5000); // Centro del mundo como fallback
                }
            }
            return;
        }

        // Verificar drones sin batería cada frame
        this.verificarDronesSinBateria();
        
        // Aplicar visualización de drenaje de batería en frontend (solo visual, el backend es autoritativo)
        // Esto asegura que la barra de batería se actualice suavemente incluso cuando el dron está estacionario
        this.aplicarDrenajeTemporalBateria();

        let moved = false;
        const speed = 2.5;

        
        let nextX = target.x;
        let nextY = target.y;
        let nextAngle;
        if (target.angle) {
            nextAngle = target.angle;
        } else {
            nextAngle = 0;
        }

        if (this.cursors.left.isDown) {
            nextX -= speed;
            nextAngle = 180;
            moved = true;
        }
        else if (this.cursors.right.isDown) {
            nextX += speed;
            nextAngle = 0;
            moved = true;
        }

        if (this.cursors.up.isDown) {
            nextY -= speed;
            nextAngle = -90;
            moved = true;
        }
        else if (this.cursors.down.isDown) {
            nextY += speed;
            nextAngle = 90;
            moved = true;
        }

      
        if (this.cursors.up.isDown && this.cursors.right.isDown) {
            nextAngle = -45;
        }
        if (this.cursors.up.isDown && this.cursors.left.isDown) {
            nextAngle = -135;
        }
        if (this.cursors.down.isDown && this.cursors.right.isDown) {
            nextAngle = 45;
        }
        if (this.cursors.down.isDown && this.cursors.left.isDown) {
            nextAngle = 135;
        }

        
        // fondo estático uniforme para mantener apariencia consistente

        if (moved) {
            this.solicitarMovimientoObjetivo(target, nextX, nextY, nextAngle);
        }

        this.dibujarVision();
        this.actualizarMiniMapa();
        this.actualizarIndicadorPortadron();
    }

    crearMiniMapa() {
        const width = 200;
        const height = 130;
        const depth = 9500;

        const fondo = this.add.rectangle(0, 0, width, height, 0x113355, 0.65)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(depth);

        const borde = this.add.graphics();
        borde.setScrollFactor(0);
        borde.setDepth(depth + 0.1);

        const puntoPortadron = this.add.circle(0, 0, 4, 0xffffff, 1)
            .setScrollFactor(0)
            .setDepth(depth + 1);

        const etiquetaPortadron = this.add.text(0, 0, '', {
            font: 'bold 12px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        })
            .setScrollFactor(0)
            .setDepth(depth + 1);

        const puntoDron = this.add.circle(0, 0, 4, 0xfff066, 1)
            .setScrollFactor(0)
            .setDepth(depth + 1);

        const etiquetaDron = this.add.text(0, 0, '', {
            font: 'bold 12px Arial',
            fill: '#fff066',
            stroke: '#000000',
            strokeThickness: 3
        })
            .setScrollFactor(0)
            .setDepth(depth + 1);

        this.minimap = {
            x: 0,
            y: 0,
            width,
            height,
            padding: 12,
            depth,
            fondo,
            borde,
            puntoPortadron,
            etiquetaPortadron,
            puntoDron,
            etiquetaDron,
            dronePoints: [], // Arreglo para puntos de drones dinámicos
        };

        this.posicionarMiniMapa();
        this.actualizarMiniMapa();
    }

    posicionarMiniMapa() {
        if (!this.minimap) {
            return;
        }

        const margenIzq = 245;
        const margenInferior = 16;
        const maxX = Math.max(20, this.scale.width - this.minimap.width - 20);
        this.minimap.x = Phaser.Math.Clamp(margenIzq, 20, maxX);
        this.minimap.y = Math.max(20, this.scale.height - this.minimap.height - margenInferior);

        this.minimap.fondo.setPosition(this.minimap.x, this.minimap.y);

        this.minimap.borde.clear();
        this.minimap.borde.lineStyle(2, 0xe6f0ff, 0.85);
        this.minimap.borde.strokeRect(this.minimap.x, this.minimap.y, this.minimap.width, this.minimap.height);
    }

    obtenerLimitesMiniMapa() {
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        const considerar = (x, y) => {
            const nx = Number(x);
            const ny = Number(y);
            if (!Number.isFinite(nx) || !Number.isFinite(ny)) {
                return;
            }
            minX = Math.min(minX, nx);
            minY = Math.min(minY, ny);
            maxX = Math.max(maxX, nx);
            maxY = Math.max(maxY, ny);
        };

        this.elementosBackendEstado.forEach((elemento) => {
            if (!elemento || !this.esEstadoActivo(elemento.estado)) {
                return;
            }
            considerar(elemento.x, elemento.y);
        });

        if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
            return {
                minX: 0,
                minY: 0,
                maxX: this.scale.width || 1000,
                maxY: this.scale.height || 700
            };
        }

        const anchoMinimo = 400;
        const altoMinimo = 300;
        const centroX = (minX + maxX) / 2;
        const centroY = (minY + maxY) / 2;
        const halfW = Math.max((maxX - minX) / 2, anchoMinimo / 2);
        const halfH = Math.max((maxY - minY) / 2, altoMinimo / 2);
        const padding = 120;

        return {
            minX: centroX - halfW - padding,
            minY: centroY - halfH - padding,
            maxX: centroX + halfW + padding,
            maxY: centroY + halfH + padding
        };
    }

    mundoAMiniMapa(xMundo, yMundo, limites) {
        if (!this.minimap || !limites) {
            return null;
        }

        const spanX = Math.max(1, limites.maxX - limites.minX);
        const spanY = Math.max(1, limites.maxY - limites.minY);
        const tX = Phaser.Math.Clamp((Number(xMundo) - limites.minX) / spanX, 0, 1);
        const tY = Phaser.Math.Clamp((Number(yMundo) - limites.minY) / spanY, 0, 1);

        return {
            x: this.minimap.x + (tX * this.minimap.width),
            y: this.minimap.y + (tY * this.minimap.height)
        };
    }

    actualizarMiniMapa() {
        if (!this.minimap) {
            return;
        }

        const limites = this.obtenerLimitesMiniMapa();

        // Own Porter
        const porta = this.obtenerEstadoPortadronPropio();
        if (porta && this.esEstadoActivo(porta.estado)) {
            const posPorta = this.mundoAMiniMapa(porta.x, porta.y, limites);
            if (posPorta) {
                this.minimap.puntoPortadron.setVisible(true);
                this.minimap.puntoPortadron.setPosition(posPorta.x, posPorta.y);

                const etiqueta = `PORTADRON ${String(this.playerTeam || '').toUpperCase()}`;
                this.minimap.etiquetaPortadron.setVisible(true);
                this.minimap.etiquetaPortadron.setText(etiqueta);
                this.minimap.etiquetaPortadron.setPosition(posPorta.x + 8, posPorta.y - 16);
            } else {
                this.minimap.puntoPortadron.setVisible(false);
                this.minimap.etiquetaPortadron.setVisible(false);
            }
        } else {
            this.minimap.puntoPortadron.setVisible(false);
            this.minimap.etiquetaPortadron.setVisible(false);
        }
        
        // Portadores enemigos - mostrar todos los portadores enemigos activos en el minimapa
        if (!this.minimap.enemyPorterPoints) {
            this.minimap.enemyPorterPoints = [];
        }
        
        const currentEnemyPorters = [];
        let totalPorters = 0;
        let filteredOut = [];
        
        try {
            this.elementosEstado.forEach((elemento, clave) => {
                if (elemento.clase === 'PORTADRON') {
                    totalPorters++;
                    const isOwn = this.esElementoPropio(elemento);
                    const isActive = this.esEstadoActivo(elemento.estado);
                    const atOrigin = (elemento.x === 0 && elemento.y === 0);
                    
                    if (isOwn) {
                        filteredOut.push({ id: elemento.id, reason: 'own porter', team: elemento.tipoEquipo });
                    } else if (!isActive) {
                        filteredOut.push({ id: elemento.id, reason: `estado=${elemento.estado}`, team: elemento.tipoEquipo });
                    } else if (atOrigin) {
                        filteredOut.push({ id: elemento.id, reason: 'at origin (0,0)', team: elemento.tipoEquipo });
                    } else {
                        currentEnemyPorters.push(elemento);
                    }
                }
            });
            
            // DEBUGUEAR: Registrar visibilidad de portadron enemigo en minimapa
            if (totalPorters > 0) {
                console.log(`%cMINIMAPA: Portadrones: ${totalPorters} total, ${currentEnemyPorters.length} ENEMIGOS mostrados`, 'color: #ff00ff; font-weight: bold', {
                    playerTeam: this.playerTeam,
                    ownPortadronId: this.ownPortadronId,
                    enemyPorters: currentEnemyPorters.map(p => ({ 
                        id: p.id, 
                        x: Math.round(p.x), 
                        y: Math.round(p.y), 
                        estado: p.estado, 
                        tipoEquipo: p.tipoEquipo 
                    })),
                    filteredOut: filteredOut
                });
                
                // VERIFICACION CRITICA: Si no se muestran portadores enemigos pero filtramos algunos, verificar bugs de asignacion de equipo
                if (currentEnemyPorters.length === 0 && filteredOut.length > 0) {
                    const allSameTeam = filteredOut.every(f => f.team === this.playerTeam);
                    if (allSameTeam && totalPorters > 1) {
                        console.error(`%cBUG DE DATOS DEL BACKEND: Todos los portadrones tienen el mismo equipo`, 'color: #ff0000; font-size: 16px; font-weight: bold');
                        console.error(`El backend envio ${totalPorters} portadrones, TODOS con tipoEquipo="${this.playerTeam}"`);
                        console.error(`Los portadrones enemigos no pueden distinguirse. El backend debe enviar tipoEquipo diferente para cada equipo`);
                    }
                }
            }
        } catch (error) {
            console.error('MINIMAPA: Error procesando portadrones enemigos:', error);
        }
        
        // Hide old enemy porter points
        const currentEnemyPorterIds = new Set(currentEnemyPorters.map(p => p.id));
        this.minimap.enemyPorterPoints = this.minimap.enemyPorterPoints.filter(point => {
            if (!currentEnemyPorterIds.has(point.porterId)) {
                point.circle.destroy();
                point.label.destroy();
                return false;
            }
            return true;
        });
        
        // Renderizar todos los portadrones enemigos en ROJO
        currentEnemyPorters.forEach(enemyPorter => {
            const posEnemy = this.mundoAMiniMapa(enemyPorter.x, enemyPorter.y, limites);
            if (!posEnemy) return;
            
            let point = this.minimap.enemyPorterPoints.find(p => p.porterId === enemyPorter.id);
            if (!point) {
                const circle = this.add.circle(0, 0, 6, 0xff0000, 1)
                    .setScrollFactor(0)
                    .setDepth(this.minimap.depth + 1);
                const label = this.add.text(0, 0, '', {
                    font: 'bold 10px Arial',
                    fill: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 2
                })
                    .setScrollFactor(0)
                    .setDepth(this.minimap.depth + 1);
                point = { porterId: enemyPorter.id, circle, label };
                this.minimap.enemyPorterPoints.push(point);
            }
            
            point.circle.setPosition(posEnemy.x, posEnemy.y);
            point.circle.setVisible(true);
            point.label.setText('ENEMIGO');
            point.label.setPosition(posEnemy.x + 8, posEnemy.y - 10);
            point.label.setVisible(true);
        });
        
        // Drones enemigos - mostrar todos los drones enemigos activos en el minimapa
        if (!this.minimap.enemyDronePoints) {
            this.minimap.enemyDronePoints = [];
        }
        
        const currentEnemyDrones = [];
        this.elementosEstado.forEach((elemento, clave) => {
            // Omitir drones en (0,0) - estos son drones no desplegados almacenados en el origen
            if (elemento.clase === 'DRON' && !this.esElementoPropio(elemento) && elemento.estado === 'ACTIVO' && (elemento.x !== 0 || elemento.y !== 0)) {
                currentEnemyDrones.push(elemento);
            }
        });
        
        // Hide old enemy drone points
        const currentEnemyDroneIds = new Set(currentEnemyDrones.map(d => d.id));
        this.minimap.enemyDronePoints = this.minimap.enemyDronePoints.filter(point => {
            if (!currentEnemyDroneIds.has(point.droneId)) {
                point.circle.destroy();
                return false;
            }
            return true;
        });
        
        // Renderizar todos los drones enemigos en NARANJA (círculos más pequeños)
        currentEnemyDrones.forEach(enemyDrone => {
            const posEnemy = this.mundoAMiniMapa(enemyDrone.x, enemyDrone.y, limites);
            if (!posEnemy) return;
            
            let point = this.minimap.enemyDronePoints.find(p => p.droneId === enemyDrone.id);
            if (!point) {
                const circle = this.add.circle(0, 0, 3, 0xff6600, 1)
                    .setScrollFactor(0)
                    .setDepth(this.minimap.depth + 1);
                point = { droneId: enemyDrone.id, circle };
                this.minimap.enemyDronePoints.push(point);
            }
            
            point.circle.setPosition(posEnemy.x, posEnemy.y);
            point.circle.setVisible(true);
        });

        // Todos los drones - mostrar todos los drones propios activos en el minimapa
        this.actualizarListaDronesActivos();
        
        let activeDronId;
        if (this.activeDron) {
            activeDronId = this.activeDron.getData('elementId') || this.activeDron.id;
        } else {
            activeDronId = null;
        }
        
        // Ocultar puntos de drones antiguos que ya no están activos
        const currentDroneIds = new Set(this.dronesActivosOrdenados.map(d => d.id));
        this.minimap.dronePoints = this.minimap.dronePoints.filter(point => {
            if (!currentDroneIds.has(point.dronId)) {
                // Destruir puntos para drones que ya no están en la lista
                point.circle.destroy();
                point.label.destroy();
                return false;
            }
            return true;
        });
        
        // Renderizar todos los drones activos
        this.dronesActivosOrdenados.forEach(dronData => {
            const dron = dronData.elemento;
            const dronId = dron.id;
            const isActive = String(dronId) === String(activeDronId);
            
            // Omitir drones en (0,0) - estos son drones no desplegados almacenados en el origen
            if (dron.x === 0 && dron.y === 0) {
                return;
            }
            
            const posDron = this.mundoAMiniMapa(dron.x, dron.y, limites);
            if (!posDron) {
                return;
            }
            
            // Buscar punto existente o crear uno nuevo
            let point = this.minimap.dronePoints.find(p => p.dronId === dronId);
            if (!point) {
                const circle = this.add.circle(0, 0, 4, 0xfff066, 1)
                    .setScrollFactor(0)
                    .setDepth(this.minimap.depth + 1);
                    
                const label = this.add.text(0, 0, '', {
                    font: 'bold 11px Arial',
                    fill: '#fff066',
                    stroke: '#000000',
                    strokeThickness: 2
                })
                    .setScrollFactor(0)
                    .setDepth(this.minimap.depth + 1);
                    
                point = { dronId, circle, label };
                this.minimap.dronePoints.push(point);
            }
            
            // Actualizar posición y apariencia
            point.circle.setPosition(posDron.x, posDron.y);
            point.circle.setVisible(true);
            
            // Highlight active drone
            if (isActive) {
                point.circle.setFillStyle(0x00ff00); // Verde para activo
                point.circle.setRadius(5); // Larger
            } else {
                point.circle.setFillStyle(0xfff066); // Amarillo para inactivo
                point.circle.setRadius(3.5); // Smaller
            }
            
            // Actualizar etiqueta con número de dron
            const droneLabel = this.obtenerEtiquetaElementoMasLinda(dron);
            point.label.setText(droneLabel);
            point.label.setPosition(posDron.x + 8, posDron.y + 6);
            point.label.setVisible(true);
        });
    }

    crearIndicadorPortadron() {
        const arrowKey = 'indicador_portadron_arrow';
        if (!this.textures.exists(arrowKey)) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xffffff, 1);
            g.fillTriangle(10, 0, 20, 20, 0, 20);
            g.lineStyle(2, 0x111111, 0.85);
            g.strokeTriangle(10, 0, 20, 20, 0, 20);
            g.generateTexture(arrowKey, 20, 20);
            g.destroy();
        }

        this.portadronDirectionArrow = this.add.sprite(0, 0, arrowKey);
        this.portadronDirectionArrow.setOrigin(0.5, 0.5);
        this.portadronDirectionArrow.setDisplaySize(24, 24);
        this.portadronDirectionArrow.setDepth(9400);
        this.portadronDirectionArrow.setVisible(false);

        // Crear indicador de zona de recarga (círculo alrededor del portadron)
        this.rechargeZoneGraphics = this.add.graphics();
        this.rechargeZoneGraphics.setScrollFactor(1, 1); // Seguir cámara (predeterminado pero explícito)
        this.rechargeZoneGraphics.setDepth(9600); // Por encima de todo incluyendo niebla y elementos de UI
        this.rechargeZoneGraphics.setVisible(false);
        console.log('Zona de Recarga: Graficos inicializados - scrollFactor:', this.rechargeZoneGraphics.scrollFactorX, this.rechargeZoneGraphics.scrollFactorY, 'depth:', this.rechargeZoneGraphics.depth);

        // Crear zona clickeable invisible para recarga
        this.rechargeZoneClickable = this.add.zone(0, 0, 440, 440); // 220px radius = 440px diameter
        this.rechargeZoneClickable.setOrigin(0.5, 0.5);
        this.rechargeZoneClickable.setScrollFactor(1, 1); // Seguir cámara
        this.rechargeZoneClickable.setInteractive({ useHandCursor: true, draggable: false });
        this.rechargeZoneClickable.setDepth(9599);
        // NOTA: Las zonas son invisibles por defecto, nunca llamar setVisible(false) o el input no funcionará!
        console.log('Zona de Recarga: Zona clickeable inicializada');
        this.rechargeZoneClickable.on('pointerdown', () => {
            console.log('Zona de Recarga: ========== ZONA CLICKEADA ==========');
            console.log('Zona de Recarga: Modo actual:', this.controlMode);
            let activeDronStatus;
            if (this.activeDron) {
                activeDronStatus = 'exists';
            } else {
                activeDronStatus = 'NULL';
            }
            console.log('Zona de Recarga: Dron activo:', activeDronStatus);
            
            const porta = this.obtenerEstadoPortadronPropio();
            if (!porta) {
                console.log('Zona de Recarga: Portadron no encontrado');
                return;
            }
            if (this.controlMode !== 'DRON') {
                console.log('Zona de Recarga: No esta en modo DRON');
                return;
            }
            if (!this.activeDron) {
                console.log('Zona de Recarga: No hay dron activo');
                return;
            }
            console.log('Zona de Recarga: Todas las verificaciones pasadas, llamando solicitarRecargaDron con ID de porter:', porta.id);
            this.solicitarRecargaDron(porta.id);
        });
    }

    obtenerEstadoPortadronPropio() {
        if (this.ownPortadronId === null || this.ownPortadronId === undefined) {
            return null;
        }

        const clave = this.buscarClaveBackendExistentePorId(this.ownPortadronId);
        if (!clave) {
            return null;
        }

        const porta = this.elementosBackendEstado.get(clave);
        if (!porta || porta.clase !== 'PORTADRON') {
            return null;
        }

        return porta;
    }

    obtenerEstadoDronActivo() {
        if (!this.activeDron) {
            return null;
        }

        const dronId = this.activeDron.getData('elementId') || this.activeDron.id;
        if (dronId === undefined || dronId === null) {
            return null;
        }

        const clave = this.buscarClaveBackendExistentePorId(dronId);
        if (!clave) {
            return null;
        }

        const dron = this.elementosBackendEstado.get(clave);
        if (!dron || dron.clase !== 'DRON') {
            return null;
        }

        return dron;
    }

    obtenerDronPropioClickeado(gameObjects) {
        // Buscar si el usuario hizo clic en alguno de sus propios drones
        if (!gameObjects || gameObjects.length === 0) {
            return null;
        }
        
        for (const obj of gameObjects) {
            let elementId;
            if (obj.getData) {
                elementId = obj.getData('elementId');
            } else {
                elementId = null;
            }
            if (!elementId) {
                continue;
            }
            
            const clave = this.buscarClaveExistentePorId(elementId);
            if (!clave) {
                continue;
            }
            
            const elemento = this.elementosEstado.get(clave);
            if (!elemento || elemento.clase !== 'DRON') {
                continue;
            }
            
            if (!this.esElementoPropio(elemento)) {
                continue;
            }
            
            // Solo permitir interacción si el dron está ACTIVO (no DESTRUIDO o SIN_BATERIA)
            const estadoUpper = String(elemento.estado).toUpperCase();
            if (estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE') {
                return elemento;
            }
        }
        
        return null;
    }

    marcarPortadronBajoAtaque() {
        if (!this.time) {
            return;
        }
        this.portadronBajoAtaqueHasta = this.time.now + 1600;
    }

    estaPortadronBajoAtaque() {
        if (!this.time) {
            return false;
        }
        return this.time.now < this.portadronBajoAtaqueHasta;
    }

    actualizarIndicadorPortadron() {
        if (!this.portadronDirectionArrow) {
            return;
        }

        if (this.controlMode !== 'DRON' || !this.activeDron) {
            this.portadronDirectionArrow.setVisible(false);
            this.actualizarZonaRecarga();
            return;
        }

        const porta = this.obtenerEstadoPortadronPropio();
        if (!porta || !this.esEstadoActivo(porta.estado)) {
            this.portadronDirectionArrow.setVisible(false);
            this.actualizarZonaRecarga();
            return;
        }

        const dron = this.obtenerEstadoDronActivo();
        if (!dron || !this.esEstadoActivo(dron.estado)) {
            this.portadronDirectionArrow.setVisible(false);
            this.actualizarZonaRecarga();
            return;
        }

        const dronX = Number(dron.x);
        const dronY = Number(dron.y);
        if (!Number.isFinite(dronX) || !Number.isFinite(dronY)) {
            this.portadronDirectionArrow.setVisible(false);
            this.actualizarZonaRecarga();
            return;
        }

        const arrowX = dronX;
        const arrowY = dronY + 28;
        const rotation = Phaser.Math.Angle.Between(arrowX, arrowY, Number(porta.x) || 0, Number(porta.y) || 0) + (Math.PI / 2);

        this.portadronDirectionArrow.setPosition(arrowX, arrowY);
        this.portadronDirectionArrow.setRotation(rotation);
        let arrowColor;
        if (this.estaPortadronBajoAtaque()) {
            arrowColor = this.colorIndicadorPortadronAtaque;
        } else {
            arrowColor = this.colorIndicadorPortadronNormal;
        }
        this.portadronDirectionArrow.setTint(arrowColor);
        this.portadronDirectionArrow.setVisible(true);

        // Actualizar zona de recarga
        this.actualizarZonaRecarga();
    }

    actualizarZonaRecarga() {
        if (!this.rechargeZoneGraphics || !this.rechargeZoneClickable) {
            console.log('Zona de Recarga: Graficos no inicializados');
            return;
        }

        // Solo mostrar zona de recarga cuando se controla un dron
        if (this.controlMode !== 'DRON' || !this.activeDron) {
            this.rechargeZoneGraphics.setVisible(false);
            this.rechargeZoneClickable.disableInteractive(); // Deshabilitar entrada en lugar de ocultar
            if (this.txtRechargeHint) this.txtRechargeHint.setVisible(false);
            return;
        }

        const porta = this.obtenerEstadoPortadronPropio();
        const dron = this.obtenerEstadoDronActivo();

        if (!porta || !this.esEstadoActivo(porta.estado)) {
            console.log('Zona de Recarga: Portadron no encontrado o no activo');
            this.rechargeZoneGraphics.setVisible(false);
            this.rechargeZoneClickable.disableInteractive();
            if (this.txtRechargeHint) this.txtRechargeHint.setVisible(false);
            return;
        }

        if (!dron || !this.esEstadoActivo(dron.estado)) {
            console.log('Zona de Recarga: Dron no encontrado o no activo');
            this.rechargeZoneGraphics.setVisible(false);
            this.rechargeZoneClickable.disableInteractive();
            if (this.txtRechargeHint) this.txtRechargeHint.setVisible(false);
            return;
        }

        // Si tenemos un sprite de dron activo que es visible, el dron está desplegado
        // NOTA: No chequear coordenada z - representa altitud (0 para drones navales al nivel del mar)
        // En lugar, chequear si el sprite de dron existe y es visible
        if (!this.activeDron || !this.activeDron.visible) {
            console.log('Zona de Recarga: Sprite de dron no visible - no desplegado');
            this.rechargeZoneGraphics.setVisible(false);
            this.rechargeZoneClickable.disableInteractive();
            if (this.txtRechargeHint) this.txtRechargeHint.setVisible(false);
            return;
        }

        // Calcular distancia del dron al portador
        const dx = Number(dron.x) - Number(porta.x);
        const dy = Number(dron.y) - Number(porta.y);
        const distancia = Math.sqrt((dx * dx) + (dy * dy));

        // Zona mas pequena y sutil - radio aumentado para tolerancia
        const rechargeRadius = 120; // Smaller visual zone (was 200)
        const rechargeDistance = 220; // Larger functional range (was 200)
        const inRange = Number.isFinite(distancia) && distancia <= rechargeDistance;

        console.log(`Zona de Recarga: Visible - Porter: (${porta.x}, ${porta.y}), Dron: (${dron.x}, ${dron.y}), Distancia: ${distancia.toFixed(1)}, EnRango: ${inRange}`);

        // Dibujar el circulo de zona de recarga - SUTIL Y PEQUENO
        this.rechargeZoneGraphics.clear();

        // Inner fill - SUBTLE
        let fillColor;
        if (inRange) {
            fillColor = 0x00ff00;
        } else {
            fillColor = 0xffaa00;
        }
        this.rechargeZoneGraphics.fillStyle(fillColor, 0.15); // More transparent
        this.rechargeZoneGraphics.fillCircle(porta.x, porta.y, rechargeRadius);

        // Outer circle (border) - MODERATE
        let borderColor;
        if (inRange) {
            borderColor = 0x00ff00;
        } else {
            borderColor = 0xffaa00;
        }
        this.rechargeZoneGraphics.lineStyle(3, borderColor, 0.7); // Thinner, more transparent
        this.rechargeZoneGraphics.strokeCircle(porta.x, porta.y, rechargeRadius);

        // Punto central para marcar posicion del portador - PEQUENO
        this.rechargeZoneGraphics.fillStyle(0xffffff, 0.8); // Slightly transparent white
        this.rechargeZoneGraphics.fillCircle(porta.x, porta.y, 10);
        let centerColor;
        if (inRange) {
            centerColor = 0x00ff00;
        } else {
            centerColor = 0xffaa00;
        }
        this.rechargeZoneGraphics.fillStyle(centerColor, 0.9);
        this.rechargeZoneGraphics.fillCircle(porta.x, porta.y, 7);

        this.rechargeZoneGraphics.setVisible(true);

        // Actualizar posición de zona clickeable y habilitar input
        this.rechargeZoneClickable.setPosition(porta.x, porta.y);
        this.rechargeZoneClickable.setInteractive({ useHandCursor: true }); // Rehabilitar si estaba deshabilitado

        // Mostrar texto de sugerencia solo cuando esta en rango
        if (this.txtRechargeHint) {
            this.txtRechargeHint.setVisible(inRange);
        }
    }

    procesarPartidaIniciada(datosPartida) {
        if (!datosPartida) {
            return;
        }

        this.resolverEquipoJugador(datosPartida);
        console.log('Juego: Identidad local -> playerId:', this.playerId, 'nickname:', this.nickname, 'team:', this.playerTeam);

        const elementos = this.extraerElementosIniciales(datosPartida);
        const cantPortaAereo = elementos.filter((e) => e.clase === 'PORTADRON' && e.tipoEquipo === 'AEREO').length;
        const cantPortaNaval = elementos.filter((e) => e.clase === 'PORTADRON' && e.tipoEquipo === 'NAVAL').length;
        const cantDronAereo = elementos.filter((e) => e.clase === 'DRON' && e.tipoEquipo === 'AEREO').length;
        const cantDronNaval = elementos.filter((e) => e.clase === 'DRON' && e.tipoEquipo === 'NAVAL').length;
        console.log('Juego: Portadrones extraidos -> AEREO:', cantPortaAereo, 'NAVAL:', cantPortaNaval);
        console.log('Juego: Drones extraidos -> AEREO:', cantDronAereo, 'NAVAL:', cantDronNaval);
        elementos
            .filter((e) => e.clase === 'PORTADRON')
            .forEach((e) => {
                console.log('Juego: Portadron:', e.id, 'tipoEquipo:', e.tipoEquipo, 'textura:', this.obtenerTexturaElemento(e));
            });
        this.guardarElementos(elementos);
        this.guardarElementosBackend(elementos);
        this.colocarUnidadSegunEquipo();
        this.renderizarElementos();
        this.actualizarHUDDesdePortadronActivo(this.unit);
        this.dibujarVision();
    }

    resolverEquipoJugador(datosPartida) {
        if (!datosPartida) {
            return;
        }

        if (Array.isArray(datosPartida.listaJugadores)) {
            this.jugadoresCount = datosPartida.listaJugadores.length;

            const jugadores = datosPartida.listaJugadores;
            let jugadorPropio = null;

            for (let i = 0; i < jugadores.length; i++) {
                const jugador = jugadores[i];
                if (!jugador) {
                    continue;
                }

                if (jugador.id && this.playerId && String(jugador.id) === String(this.playerId)) {
                    jugadorPropio = jugador;
                    break;
                }
            }

            const teamJugador = String(jugadorPropio?.team || '').toUpperCase();
            if (teamJugador === 'AEREO' || teamJugador === 'NAVAL') {
                this.playerTeam = teamJugador;
            }
        }

        const identidad = this.obtenerIdentidadDesdePortadrones(datosPartida);
        if (identidad) {
            this.playerTeam = identidad.tipoEquipo;
            this.ownPortadronId = identidad.idPortadron;
        } else {
            this.ownPortadronId = null;
        }

        this.configurarUnidadSegunEquipo();
        this.actualizarHUDEquipo();
    }

    obtenerIdentidadDesdePortadrones(datosPartida) {
        const playerIdLocal = String(this.playerId || '');
        if (!playerIdLocal) {
            return null;
        }

        const buscarEnLista = (listaPortas, tipoEquipo) => {
            if (!Array.isArray(listaPortas)) {
                return null;
            }

            for (let i = 0; i < listaPortas.length; i++) {
                const porta = listaPortas[i];
                if (!porta) {
                    continue;
                }

                const jugadorIdPorta = String(porta.jugadorId || porta.playerId || porta.ownerId || '');
                if (playerIdLocal && jugadorIdPorta && jugadorIdPorta === playerIdLocal) {
                    return {
                        idPortadron: porta.id,
                        tipoEquipo: tipoEquipo
                    };
                }
            }

            return null;
        };

        const propioAereo = buscarEnLista(datosPartida.listaPortaDronesAereos, 'AEREO');
        if (propioAereo) {
            return propioAereo;
        }

        const propioNaval = buscarEnLista(datosPartida.listaPortaDronesNavales, 'NAVAL');
        if (propioNaval) {
            return propioNaval;
        }

        return null;
    }

    actualizarHUDEquipo() {
        if (this.txtEquipo) {
            this.txtEquipo.setText(`EQUIPO ${this.playerTeam}`);
        }
    }

    crearTituloYBotonSalida() {
        this.titleText = this.add.text(
            this.scale.width / 2,
            45,
            'Sistema Web de Simulación de\nCombate Aéreo‑Naval con Drones',
            {
                fontSize: '30px',
                fontStyle: 'bold',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        )
            .setOrigin(0.5)
            .setShadow(0, 0, '#e1f1f19a', 20, true, true)
            .setScrollFactor(0)
            .setDepth(9500);

        const exitHtml = `
            <button id="salirPartida" style="
                padding:12px 22px;
                border-radius:25px;
                border:none;
                background:linear-gradient(90deg, #e1f1f158, #e1f1f19a);
                color:#000;
                font-size:18px;
                font-weight:bold;
                cursor:pointer;
                transition:all 0.25s ease;
                box-shadow:0 0 10px rgba(18,18,18,0.83);
            ">Salir de la partida y guardar</button>
        `;

        this.exitButtonDom = this.add.dom(this.scale.width - 210, this.scale.height - 40).createFromHTML(exitHtml);
        this.exitButtonDom.setScrollFactor(0);
        this.exitButtonDom.setDepth(9500);
        this.exitButtonDom.node.style.pointerEvents = 'auto';

        const exitBtn = this.exitButtonDom.node.querySelector('#salirPartida');
        if (exitBtn) {
            exitBtn.addEventListener('mouseenter', () => {
                exitBtn.style.transform = 'scale(1.08)';
                exitBtn.style.boxShadow = '0 0 25px rgba(18, 18, 18, 0.83)';
            });
            exitBtn.addEventListener('mouseleave', () => {
                exitBtn.style.transform = 'scale(1)';
                exitBtn.style.boxShadow = '0 0 10px rgba(248, 250, 250, 0.5)';
            });
            exitBtn.addEventListener('click', () => {
                this.scene.start('GameChoice');
            });
        }
    }

    seleccionarPortadron(spritePortadron) {
        if (!spritePortadron) {
            return;
        }

        const portaId = spritePortadron.getData('elementId') || spritePortadron.id;

        if (this.ownPortadronId !== null && this.ownPortadronId !== undefined) {
            if (String(portaId) !== String(this.ownPortadronId)) {
                return;
            }
        }

        const dronInicial = this.obtenerPrimerDronDePortadron(portaId);
        if (dronInicial) {
            const dronId = dronInicial.getData('elementId') || dronInicial.id;
            if (!this.dronesActivados.has(String(dronId))) {
                dronInicial.setPosition(spritePortadron.x, spritePortadron.y);
                const claveDron = this.buscarClaveExistentePorId(dronId);
                if (claveDron) {
                    const dronEstado = this.elementosEstado.get(claveDron);
                    if (dronEstado) {
                        dronEstado.x = spritePortadron.x;
                        dronEstado.y = spritePortadron.y;
                        this.elementosEstado.set(claveDron, dronEstado);
                    }
                }
                this.dronesActivados.add(String(dronId));
            }
            this.seleccionarDron(dronInicial);
            return;
        }

        this.controlMode = 'PORTADRONES';
        this.activeDron = null;
        this.cameras.main.startFollow(spritePortadron, true, 0.08, 0.08);
        this.actualizarVisionPorObjeto(spritePortadron);
        this.dibujarVision();
        this.actualizarHUDDesdePortadronActivo(spritePortadron);
        if (this.txtModo) {
            const portadronLabel = `PORTADRON ${String(this.playerTeam || '').toUpperCase()}`;
            this.txtModo.setText(`CONTROL ${portadronLabel}`);
        }
    }

    seleccionarDron(spriteDron) {
        if (!spriteDron) {
            console.log('Seleccion: Sin sprite provisto');
            return;
        }

        const dronId = spriteDron.getData('elementId') || spriteDron.id;
        const clavePropia = this.buscarClaveExistentePorId(dronId);
        if (clavePropia) {
            const dronEstadoPropio = this.elementosEstado.get(clavePropia);
            
            // Chequeo de seguridad: no seleccionar drones destruidos/inactivos
            if (dronEstadoPropio) {
                const estadoUpper = String(dronEstadoPropio.estado).toUpperCase();
                if (estadoUpper === 'DESTRUIDO' || estadoUpper === 'DESTROYED' || estadoUpper === 'INACTIVO' || estadoUpper === 'INACTIVE') {
                    console.log(`Seleccion: No se puede seleccionar dron ${dronId} con estado ${dronEstadoPropio.estado}`);
                    return;
                }
                
                if (!this.esElementoPropio(dronEstadoPropio)) {
                    console.log(`Seleccion: Dron ${dronId} no pertenece al jugador`);
                    return;
                }
            }

            const dronYaActivado = this.dronesActivados.has(String(dronId));
            if (!dronYaActivado && dronEstadoPropio) {
                const portaPadre = this.obtenerPortadronPadreDeDron(dronEstadoPropio);
                if (portaPadre) {
                    dronEstadoPropio.x = Number(portaPadre.x) || 0;
                    dronEstadoPropio.y = Number(portaPadre.y) || 0;
                    dronEstadoPropio.z = Number(portaPadre.z) || 0;
                    this.elementosEstado.set(clavePropia, dronEstadoPropio);

                    spriteDron.setPosition(dronEstadoPropio.x, dronEstadoPropio.y);
                    spriteDron.setData('elementZ', dronEstadoPropio.z);
                }
            }
        }

        console.log(`Seleccion: Seleccionando dron ${dronId}`);
        this.controlMode = 'DRON';
        this.activeDron = spriteDron;
        this.lastSelectedDronId = dronId;
        this.dronesActivados.add(String(dronId));
        
        // Reiniciar cooldown de despliegue al cambiar a modo dron
        this.lastDeploymentTime = 0;
        
        // Clear auto-switch flag since user manually selected a drone
        this.pendingDroneDeployment = false;

        const clave = this.buscarClaveExistentePorId(this.lastSelectedDronId);
        if (clave) {
            const dronEstado = this.elementosEstado.get(clave);
            if (dronEstado) {
                spriteDron.setPosition(Number(dronEstado.x) || 0, Number(dronEstado.y) || 0);
                spriteDron.setAngle(Number(dronEstado.angulo) || 0);
            }
        }

        this.cameras.main.startFollow(spriteDron, true, 0.08, 0.08);
        this.actualizarVisionPorObjeto(spriteDron);
        this.dibujarVision();
        this.actualizarHUDDesdeDronActivo();
        
        // Actualizar txtModo con etiqueta específica de dron
        if (this.txtModo) {
            const elementoDron = this.elementosEstado.get(clave);
            let labelText;
            if (elementoDron) {
                labelText = this.obtenerEtiquetaElementoMasLinda(elementoDron);
            } else {
                labelText = 'DRON';
            }
            this.txtModo.setText(`CONTROL ${labelText}`);
        }
        
        // Forzar renderizado para crear/actualizar etiqueta inmediatamente
        setTimeout(() => {
            this.renderizarElementos();
        }, 20);
        
        // Actualizar minimapa para mostrar todos los drones
        this.actualizarMiniMapa();
    }

    volverAlPortadron() {
        console.log('Porter: Regresando a modo porter');
        this.controlMode = 'PORTADRONES';
        this.activeDron = null;
        
        // Reiniciar cooldown de despliegue al regresar a modo portador
        this.lastDeploymentTime = 0;
        
        // Limpiar bandera de auto-cambio al regresar manualmente al portador
        this.pendingDroneDeployment = false;
        
        // Obtener posicion real del portador del estado del backend
        let porterX = null;
        let porterY = null;
        const porterEstado = this.obtenerEstadoPortadronPropio();
        if (porterEstado) {
            porterX = Number(porterEstado.x);
            porterY = Number(porterEstado.y);
            console.log(`Porter: Posicion del porter en backend: (${porterX}, ${porterY})`);
        }
        
        // Asegurar que this.unit es valido
        if (!this.unit || !this.unit.active) {
            console.log('Porter: sprite de unidad es invalido, recreando');
            this.configurarUnidadSegunEquipo();
        }
        
        // Establecer unidad en la posicion real del mundo del portador (no centro de pantalla)
        if (this.unit && porterX !== null && porterY !== null && Number.isFinite(porterX) && Number.isFinite(porterY)) {
            console.log(`Portadron: Estableciendo unidad en la posicion real del portadron: (${porterX}, ${porterY})`);
            this.unit.setPosition(porterX, porterY);
        } else if (this.unit && (this.unit.x === undefined || this.unit.x === null)) {
            // Fallback: si no podemos obtener posición del backend, usar centro del mundo (no centro de pantalla)
            console.warn('Porter: No se pudo obtener posicion del porter del backend, usando centro del mundo como fallback');
            this.unit.setPosition(5000, 5000); // Centro del mundo basado en limites del mundo
        }
        
        if (this.unit) {
            console.log(`Porter: Siguiendo unidad en posicion del mundo (${this.unit.x}, ${this.unit.y})`);
            this.cameras.main.startFollow(this.unit, true, 0.08, 0.08);
            this.actualizarVisionPorObjeto(this.unit);
        }
        this.dibujarVision();
        this.actualizarHUDDesdePortadronActivo(this.unit);
        if (this.txtModo) {
            const portadronLabel = `PORTADRON ${String(this.playerTeam || '').toUpperCase()}`;
            this.txtModo.setText(`CONTROL ${portadronLabel}`);
        }
        
        // Actualizar minimapa para mostrar todos los drones al volver al portadron
        this.actualizarMiniMapa();
        
        // Forzar renderizado para asegurar que todo est\u00e9 actualizado
        setTimeout(() => {
            this.renderizarElementos();
        }, 20);
    }

    intentarVolverADronSeleccionado() {
        if (this.lastSelectedDronId) {
            const clave = this.buscarClaveExistentePorId(this.lastSelectedDronId);
            if (clave) {
                const sprite = this.elementosSprites.get(clave);
                const estado = this.elementosEstado.get(clave);
                if (sprite && estado && estado.clase === 'DRON' && this.esEstadoActivo(estado.estado)) {
                    this.seleccionarDron(sprite);
                    return true;
                }
            }
        }

        if (this.ownPortadronId === null || this.ownPortadronId === undefined) {
            return false;
        }

        const dronInicial = this.obtenerPrimerDronDePortadron(this.ownPortadronId);
        if (!dronInicial) {
            return false;
        }

        this.seleccionarDron(dronInicial);
        return true;
    }

    obtenerPrimerDronDePortadron(portaId) {
        let mejor = null;
        let mejorId = Number.MAX_SAFE_INTEGER;

        this.elementosSprites.forEach((sprite, clave) => {
            const elemento = this.elementosEstado.get(clave);
            if (!elemento) {
                return;
            }

            if (elemento.clase !== 'DRON') {
                return;
            }

            if (String(elemento.parentPortadronId) !== String(portaId)) {
                return;
            }

            if (!this.esElementoPropio(elemento)) {
                return;
            }

            const idNum = Number(elemento.id);
            if (Number.isFinite(idNum) && idNum < mejorId) {
                mejorId = idNum;
                mejor = sprite;
            } else if (!Number.isFinite(idNum) && !mejor) {
                mejor = sprite;
            }
        });

        return mejor;
    }

    obtenerObjetoControlado() {
        if (this.controlMode === 'DRON' && this.activeDron) {
            return this.activeDron;
        }
        return this.unit;
    }

    moverControlConMouse(pointer) {
        const objetivo = this.obtenerObjetoControlado();
        if (!objetivo || !pointer) {
            return;
        }

        const now = this.time.now;
        if (now - this.lastMouseMoveSentAt < 30) {
            return;
        }
        this.lastMouseMoveSentAt = now;

        const prevX = objetivo.x;
        const prevY = objetivo.y;

        const targetX = pointer.worldX;
        const targetY = pointer.worldY;

        const dx = targetX - prevX;
        const dy = targetY - prevY;
        let angulo;
        if (objetivo.angle) {
            angulo = objetivo.angle;
        } else {
            angulo = 0;
        }
        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            angulo = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
        }

        this.solicitarMovimientoObjetivo(objetivo, targetX, targetY, angulo);
    }

    actualizarVisionPorObjeto(objeto) {
        if (!objeto) {
            return;
        }

        let team;
        if (objeto.getData) {
            team = objeto.getData('elementTeam');
        } else {
            team = null;
        }
        if (team === 'AEREO') {
            this.visionRange = this.visionRangeAereo;
        } else {
            this.visionRange = this.visionRangeNaval;
        }
    }

    solicitarMovimientoObjetivo(elemento, x, y, angulo) {
        if (!elemento || !elemento.active) {
            return;
        }

        // Chequear si el elemento está destruido en el backend
        let elementId;
        if (elemento.getData) {
            elementId = elemento.getData('elementId');
        } else {
            elementId = elemento.id;
        }
        if (elementId === undefined || elementId === null) {
            return;
        }
        
        const clave = this.buscarClaveBackendExistentePorId(elementId);
        let elementEstado;
        if (clave) {
            elementEstado = this.elementosBackendEstado.get(clave);
        } else {
            elementEstado = null;
        }
        if (elementEstado && elementEstado.estado === 'DESTRUIDO') {
            console.log('Movimiento: No se puede mover elemento destruido ' + elementId);
            if (this.controlMode === 'DRON') {
                this.volverAlPortadron();
            }
            return;
        }

        if (this.pendingMoveRequest) {
            return;
        }

        let z = 0;
        let zDato;
        if (elemento.getData) {
            zDato = elemento.getData('elementZ');
        } else {
            zDato = undefined;
        }
        if (zDato !== undefined && zDato !== null && Number.isFinite(Number(zDato))) {
            z = Number(zDato);
        }

        const pendingRequest = {
            elementRef: elemento,
            elementId: Number(elementId),
            x: Number(x),
            y: Number(y),
            z: z,
            angulo: Math.floor(angulo || 0)
        };

        const enviado = this.enviarAlSocket({
            tipo: "MOVER_ELEMENTO",
            idElemento: pendingRequest.elementId,
            PosicionX: pendingRequest.x,
            PosicionY: pendingRequest.y,
            PosicionZ: pendingRequest.z,
            Angulo: pendingRequest.angulo
        });

        if (!enviado) {
            return;
        }

        this.pendingMoveRequest = pendingRequest;
    }

    confirmarMovimientoPendiente() {
        if (!this.pendingMoveRequest) {
            return;
        }
        this.pendingMoveRequest = null;
    }

    rechazarMovimientoPendiente(msg) {
        if (msg) {
            console.warn('Juego: movimiento fallido', msg.mensaje || msg.Mensaje || msg);
        }
        this.pendingMoveRequest = null;
    }

    aplicarAparienciaEquipo(sprite, tipoEquipo, clase) {
        if (!sprite) {
            return;
        }

        sprite.clearTint();

        if (tipoEquipo === 'AEREO') {
            if (clase === 'PORTADRON') {
                sprite.setTint(0x9cd6ff);
            } else {
                sprite.setTint(0x66ccff);
            }
            return;
        }

        if (clase === 'PORTADRON') {
            sprite.setTint(0xffd69c);
        } else {
            sprite.setTint(0xffb366);
        }
    }

    colocarUnidadSegunEquipo() {
        if (!this.unit) {
            return;
        }

        let portaPropio = null;
        this.elementosEstado.forEach((elemento) => {
            if (portaPropio) {
                return;
            }

            if (elemento.clase !== 'PORTADRON') {
                return;
            }

            if (this.ownPortadronId !== null && this.ownPortadronId !== undefined) {
                if (String(elemento.id) === String(this.ownPortadronId)) {
                    portaPropio = elemento;
                }
            }
        });

        if (!portaPropio) {
            return;
        }

        this.ownPortadronId = portaPropio.id;
        this.ownPortadronKey = this.obtenerClaveElemento(portaPropio);

        if (!this.esEstadoActivo(portaPropio.estado)) {
            this.unit.setVisible(false);
            return;
        }

        this.unit.setVisible(true);
        this.unit.x = portaPropio.x;
        this.unit.y = portaPropio.y;
        if (portaPropio.angulo) {
            this.unit.angle = portaPropio.angulo;
        } else {
            this.unit.angle = 0;
        }
        this.unit.id = portaPropio.id;
        this.unit.setData('elementId', portaPropio.id);
        this.unit.setData('elementZ', portaPropio.z);
        this.unit.setData('elementClass', portaPropio.clase);
        this.unit.setData('elementTeam', portaPropio.tipoEquipo);
        this.aplicarAparienciaEquipo(this.unit, this.playerTeam, 'PORTADRON');
        this.actualizarVisionPorObjeto(this.unit);
    }

    extraerElementosIniciales(datosPartida) {
        const elementos = [];

        const agregarPortaYDrones = (listaPortas, tipoEquipo) => {
            if (!Array.isArray(listaPortas)) {
                return;
            }

            listaPortas.forEach((porta) => {
                if (!porta) {
                    return;
                }

                // IMPORTANTE: Escalar vida desde backend (backend usa 100 como máximo para todos los elementos)
                // Escalamos más alto para evitar muerte de un solo golpe
                let vidaBackendPorta = Number(porta.vida);
                if (!vidaBackendPorta) {
                    vidaBackendPorta = 0;
                }
                let vidaEscaladaPorta;
                if (tipoEquipo === 'AEREO') {
                    vidaEscaladaPorta = vidaBackendPorta * 10; // 1000 HP máximo para Portadron Aéreo (antes era * 6)
                } else {
                    vidaEscaladaPorta = vidaBackendPorta * 8; // 800 HP máximo para Portadron Naval (antes era * 3)
                }
                
                elementos.push({
                    id: porta.id,
                    clave: `PORTADRON_${tipoEquipo}_${porta.id}`,
                    clase: 'PORTADRON',
                    tipoEquipo: tipoEquipo,
                    x: Number(porta.x) || 0,
                    y: Number(porta.y) || 0,
                    z: Number(porta.z) || 0,
                    angulo: Number(porta.angulo) || 0,
                    vida: vidaEscaladaPorta,
                    estado: porta.estado || 'ACTIVO'
                });

                if (!Array.isArray(porta.listaDrones)) {
                    return;
                }

                porta.listaDrones.forEach((dron, indexDron) => {
                    if (!dron) {
                        return;
                    }

                    const portaX = Number(porta.x) || 0;
                    const portaY = Number(porta.y) || 0;
                    let dronX = Number(dron.x);
                    let dronY = Number(dron.y);

                    if (!Number.isFinite(dronX)) {
                        dronX = portaX;
                    }
                    if (!Number.isFinite(dronY)) {
                        dronY = portaY;
                    }

                    let listaMisiles;
                    if (Array.isArray(dron.listaMisiles)) {
                        listaMisiles = dron.listaMisiles;
                    } else {
                        listaMisiles = [];
                    }
                    let listaBombas;
                    if (Array.isArray(dron.listaBombas)) {
                        listaBombas = dron.listaBombas;
                    } else {
                        listaBombas = [];
                    }
                    let listaMuniciones;
                    if (Array.isArray(dron.listaMuniciones)) {
                        listaMuniciones = dron.listaMuniciones;
                    } else {
                        listaMuniciones = [];
                    }
                    
                    let municionDisponible;
                    if (dron.municionDisponible !== undefined && dron.municionDisponible !== null) {
                        municionDisponible = Number(dron.municionDisponible);
                    } else if (dron.cantidadMunicionesDisponibles !== undefined && dron.cantidadMunicionesDisponibles !== null) {
                        municionDisponible = Number(dron.cantidadMunicionesDisponibles);
                    } else if (dron.municion !== undefined && dron.municion !== null) {
                        municionDisponible = Number(dron.municion);
                    } else {
                        municionDisponible = NaN;
                    }

                    let cantidadMunicion = 0;
                    if (Number.isFinite(municionDisponible)) {
                        cantidadMunicion = Math.max(0, Math.floor(municionDisponible));
                    } else if (listaBombas.length > 0) {
                        cantidadMunicion = listaBombas.length;
                    } else if (listaMisiles.length > 0) {
                        cantidadMunicion = listaMisiles.length;
                    } else if (listaMuniciones.length > 0) {
                        cantidadMunicion = listaMuniciones.length;
                    }

                    let tipoMunicion;
                    if (tipoEquipo === 'AEREO') {
                        tipoMunicion = 'BOMBA';
                    } else {
                        tipoMunicion = 'MISIL';
                    }
                    if (String(dron.tipoMunicion || '').toUpperCase() === 'BOMBA') {
                        tipoMunicion = 'BOMBA';
                    }
                    if (String(dron.tipoMunicion || '').toUpperCase() === 'MISIL') {
                        tipoMunicion = 'MISIL';
                    }
                    if (listaBombas.length > 0) {
                        tipoMunicion = 'BOMBA';
                    }
                    if (listaMisiles.length > 0) {
                        tipoMunicion = 'MISIL';
                    }

                    elementos.push({
                        id: dron.id,
                        clave: `DRON_${tipoEquipo}_${dron.id}`,
                        clase: 'DRON',
                        tipoEquipo: tipoEquipo,
                        parentPortadronId: porta.id,
                        x: dronX,
                        y: dronY,
                        z: Number(porta.z) || 0,
                        angulo: Number(dron.angulo) || 0,
                        vida: Number(dron.vida) || 0,
                        estado: dron.estado || 'ACTIVO',
                        bateria: Number(dron.bateria) || 0,
                        tipoMunicion: tipoMunicion,
                        municionDisponible: cantidadMunicion
                    });
                });
            });
        };

        agregarPortaYDrones(datosPartida.listaPortaDronesAereos, 'AEREO');
        agregarPortaYDrones(datosPartida.listaPortaDronesNavales, 'NAVAL');

        return elementos;
    }

    guardarElementos(elementos) {
        if (!Array.isArray(elementos)) {
            return;
        }

        elementos.forEach((elemento) => {
            const clave = this.obtenerClaveElemento(elemento);
            this.elementosEstado.set(clave, elemento);
        });
    }

    guardarElementosBackend(elementos) {
        if (!Array.isArray(elementos)) {
            return;
        }

        elementos.forEach((elemento) => {
            const clave = this.obtenerClaveElemento(elemento);
            this.elementosBackendEstado.set(clave, { ...elemento });
        });
    }

    obtenerClaveElemento(elemento) {
        if (!elemento) {
            return '';
        }

        if (elemento.clave) {
            return String(elemento.clave);
        }

        let clase;
        if (elemento.clase) {
            clase = elemento.clase;
        } else {
            clase = 'ELEMENTO';
        }
        
        let tipoEquipo;
        if (elemento.tipoEquipo) {
            tipoEquipo = elemento.tipoEquipo;
        } else {
            tipoEquipo = 'NA';
        }
        
        return `${clase}_${tipoEquipo}_${elemento.id}`;
    }

    buscarClaveExistentePorId(idBuscado) {
        let claveEncontrada = null;
        this.elementosEstado.forEach((valor, clave) => {
            if (claveEncontrada) {
                return;
            }

            if (valor && String(valor.id) === String(idBuscado)) {
                claveEncontrada = clave;
            }
        });

        return claveEncontrada;
    }

    buscarClaveBackendExistentePorId(idBuscado) {
        let claveEncontrada = null;
        this.elementosBackendEstado.forEach((valor, clave) => {
            if (claveEncontrada) {
                return;
            }

            if (valor && String(valor.id) === String(idBuscado)) {
                claveEncontrada = clave;
            }
        });

        return claveEncontrada;
    }

    obtenerEscalaPorZ(z) {
        const zNumerico = Number(z) || 0;
        const escalaMinima = 0.5;
        const escalaMaxima = 1.8;
        const factor = 0.01;

        let escala = escalaMinima + (zNumerico * factor);
        if (escala < escalaMinima) {
            escala = escalaMinima;
        }
        if (escala > escalaMaxima) {
            escala = escalaMaxima;
        }

        return escala;
    }

    obtenerFactorTamanoPorZ(z, clase, tipoEquipo) {
        const zNumerico = Number(z) || 0;
        
        // Multiplicador de tamano base para tipo de equipo (aereo aparece mas grande en vista superior)
        let baseMultiplier = 1.0;
        if (tipoEquipo === 'AEREO') {
            baseMultiplier = 1.3; // Aereo units appear 30% larger
        } else if (tipoEquipo === 'NAVAL') {
            baseMultiplier = 1.15; // Naval units appear 15% larger
        }
        
        // Escalado adicional basado en posicion z para perspectiva de profundidad
        let minFactor;
        if (clase === 'DRON') {
            minFactor = 0.75;
        } else {
            minFactor = 0.85;
        }
        let maxFactor;
        if (clase === 'DRON') {
            maxFactor = 1.15;
        } else {
            maxFactor = 1.35;
        }
        const factorBase = 1 + (zNumerico * 0.003);
        const zFactor = Phaser.Math.Clamp(factorBase, minFactor, maxFactor);
        
        return baseMultiplier * zFactor;
    }

    obtenerFactorTamanoProyectilPorProgreso(progreso, clase) {
        // Escalar proyectiles basado en progreso de la animación (0.0 a 1.0), NO en z
        // Bombas: crecen al caer (simulando acercamiento)
        // Misiles: se mantienen constantes o crecen ligeramente
        if (clase === 'BOMBA') {
            // Bomba comienza pequeña y crece al acercarse al suelo
            const scaleFactor = 0.5 + (progreso * 0.7);
            return Phaser.Math.Clamp(scaleFactor, 0.5, 1.5);
        } else {
            // Misil se mantiene más constante
            const scaleFactor = 0.8 + (progreso * 0.3);
            return Phaser.Math.Clamp(scaleFactor, 0.8, 1.2);
        }
    }

    obtenerTexturaElemento(elemento) {
        if (elemento.clase === 'PORTADRON') {
            if (elemento.tipoEquipo === 'AEREO') {
                return 'portadron_aereo';
            }
            return 'portadron_naval';
        }

        if (elemento.tipoEquipo === 'AEREO') {
            return 'dron_aereo';
        }
        return 'dron_naval';
    }

    debeMostrarDronSobrePortadron(elemento) {
        if (!elemento || elemento.clase !== 'DRON') {
            return false;
        }

        if (!this.esElementoPropio(elemento)) {
            return false;
        }

        const activeId = this.activeDron?.getData('elementId') || this.activeDron?.id;
        if (activeId !== undefined && activeId !== null && String(activeId) === String(elemento.id)) {
            return false;
        }

        return true;
    }

    esElementoPropio(elemento){
        if (!elemento) {
            return false;
        }

        // Para portadrones: comparar ID con ownPortadronId
        if (elemento.clase === 'PORTADRON') {
            if (this.ownPortadronId !== null && this.ownPortadronId !== undefined) {
                const isOwn = String(elemento.id) === String(this.ownPortadronId);
                console.log(`PROPIEDAD: Porter ${elemento.id} verificacion: ${isOwn ? 'PROPIO' : 'ENEMIGO'}`, {
                    elementoId: elemento.id,
                    ownPortadronId: this.ownPortadronId,
                    playerTeam: this.playerTeam,
                    elementoTeam: elemento.tipoEquipo
                });
                return isOwn;
            }
            // Si aun no tenemos ownPortadronId, recurrir a chequeo de equipo
            console.warn(`PROPIEDAD: Porter ${elemento.id} verificado SIN ownPortadronId establecido. Usando comparacion de equipo (no confiable). Equipo elemento: ${elemento.tipoEquipo}, Equipo jugador: ${this.playerTeam}`);
            return elemento.tipoEquipo === this.playerTeam;
        }

        // Para drones: DEBE chequear parentPortadronId - esta es la ÚNICA manera confiable
        if (elemento.clase === 'DRON') {
            if (this.ownPortadronId !== null && this.ownPortadronId !== undefined) {
                // Identidad de propiedad basada en parentPortadronId comparado con ownPortadronId
                const isOwnDrone = String(elemento.parentPortadronId) === String(this.ownPortadronId);
                console.log('Propiedad: Verificacion de dron:', {
                    droneId: elemento.id,
                    parentPortadronId: elemento.parentPortadronId,
                    ownPortadronId: this.ownPortadronId,
                    comparison: `"${elemento.parentPortadronId}" === "${this.ownPortadronId}"`,
                    result: isOwnDrone ? 'ES PROPIO' : 'NO ES PROPIO'
                });
                return isOwnDrone;
            }
            // Si no tenemos ownPortadronId, no podemos determinar propiedad - asumir enemigo por seguridad
            console.warn('Propiedad: No se puede determinar propiedad del dron - no hay ownPortadronId establecido, asumiendo ENEMIGO');
            return false;
        }

        // Para otros elementos (proyectiles, etc), usar chequeo de equipo como fallback
        return elemento.tipoEquipo === this.playerTeam;
    }

    obtenerPortadronPadreDeDron(elementoDron) {
        if (!elementoDron || elementoDron.parentPortadronId === undefined || elementoDron.parentPortadronId === null) {
            return null;
        }

        let padre = null;
        this.elementosEstado.forEach((elemento) => {
            if (padre) {
                return;
            }

            if (elemento && elemento.clase === 'PORTADRON' && String(elemento.id) === String(elementoDron.parentPortadronId)) {
                padre = elemento;
            }
        });

        return padre;
    }

    obtenerNumeroDronEnPortadron(elementoDron) {
        if (!elementoDron || elementoDron.clase !== 'DRON') {
            return null;
        }

        const parentId = elementoDron.parentPortadronId;
        if (parentId === undefined || parentId === null) {
            return null;
        }

        const dronesDelPorta = [];
        this.elementosEstado.forEach((elemento) => {
            if (!elemento || elemento.clase !== 'DRON') {
                return;
            }

            if (String(elemento.parentPortadronId) !== String(parentId)) {
                return;
            }

            dronesDelPorta.push(elemento);
        });

        dronesDelPorta.sort((a, b) => Number(a.id) - Number(b.id));
        for (let i = 0; i < dronesDelPorta.length; i++) {
            if (String(dronesDelPorta[i].id) === String(elementoDron.id)) {
                return i + 1;
            }
        }

        return null;
    }

    obtenerEtiquetaElementoMasLinda(elemento) {
        if (!elemento) {
            return '';
        }

        const tipo = String(elemento.tipoEquipo || '').toUpperCase();
        if (elemento.clase === 'DRON') {
            const numero = this.obtenerNumeroDronEnPortadron(elemento);
            if (numero) {
                return `DRON ${tipo} ${numero}`;
            }
            return `DRON ${tipo}`;
        }

        if (elemento.clase === 'PORTADRON') {
            return `PORTADRON ${tipo}`;
        }

        return `${elemento.clase} ${tipo}`.trim();
    }
    renderizarElementos() {
        this.elementosEstado.forEach((elemento, id) => {
            // No esconder drones o portadores destruidos de inmediato para permitir que la animación de destrucción se reproduzca, pero sí esconder cualquier otro elemento no activo
            if (!this.esEstadoActivo(elemento.estado)) {
                // Si es un dron con estado DESTRUIDO, dejar que la animación se reproduzca
                if (elemento.clase === 'DRON' && elemento.estado === 'DESTRUIDO') {
                    // verificarDronesSinBateria maneja la animacion de caida, aqui solo verificamos si ya se esta animando o si el sprite ya no existe lo que indica que la animacion termino
                    // Pero si la animación no se ha iniciado y el sprite aún existe, ocultamos inmediatamente para evitar mostrar un dron destruido sin animación
                    const sprite = this.elementosSprites.get(id);
                    if (!sprite || !sprite.active || this.dronesAnimandoCaida.has(id)) {
                        // Animación completa o en progreso o sprite desaparecido - seguro para ocultar
                        if (!this.dronesAnimandoCaida.has(id)) {
                            console.log(`Limpieza: Ocultando dron DESTRUIDO ${id} sin animacion`);
                            this.ocultarElemento(id);
                        }
                    }
                    return;
                }
                
                // Si es un portadron con estado DESTRUIDO, dejar que la animación se reproduzca
                if (elemento.clase === 'PORTADRON' && elemento.estado === 'DESTRUIDO') {
                    const sprite = this.elementosSprites.get(id);
                    if (!sprite || !sprite.active || this.portersAnimandoDestruccion.has(id)) {
                        if (!this.portersAnimandoDestruccion.has(id)) {
                            console.log(`Limpieza: Ocultando porter DESTRUIDO ${id} sin animacion`);
                            this.ocultarElemento(id);
                        }
                    }
                    return;
                }
                
                this.ocultarElemento(id);
                return;
            }

            if (elemento.clase === 'PORTADRON' && this.ownPortadronKey !== null && String(id) === String(this.ownPortadronKey)) {
                this.ocultarElemento(id);
                this.actualizarLifebarPortadron(elemento, this.unit, id);

                let labelPropio = this.elementosLabels.get(id);
                const textoPropio = `PORTADRON ${String(elemento.tipoEquipo || '').toUpperCase()}`;
                let labelX;
                if (this.unit) {
                    labelX = this.unit.x;
                } else {
                    labelX = elemento.x;
                }
                let labelY;
                if (this.unit) {
                    labelY = this.unit.y - 20;
                } else {
                    labelY = elemento.y - 20;
                }

                if (!labelPropio) {
                    labelPropio = this.add.text(labelX, labelY, textoPropio, {
                        font: 'bold 14px Arial',
                        fill: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 4,
                        backgroundColor: '#00000066'
                    });
                    labelPropio.setOrigin(0.5, 1);
                    this.elementosLabels.set(id, labelPropio);
                } else {
                    labelPropio.setText(textoPropio);
                    labelPropio.setPosition(labelX, labelY);
                }

                labelPropio.setDepth((Number(elemento.z) || 0) + 1);
                return;
            }

            const textura = this.obtenerTexturaElemento(elemento);
            const factorTamano = this.obtenerFactorTamanoPorZ(elemento.z, elemento.clase, elemento.tipoEquipo);

            let displayX = elemento.x;
            let displayY = elemento.y;
            if (this.debeMostrarDronSobrePortadron(elemento)) {
                const padre = this.obtenerPortadronPadreDeDron(elemento);
                if (padre) {
                    displayX = padre.x;
                    displayY = padre.y;
                }
            }

            let sprite = this.elementosSprites.get(id);
            if (!sprite) {
                sprite = this.add.sprite(displayX, displayY, textura);
                this.elementosSprites.set(id, sprite);
            } else {
                sprite.setTexture(textura);
                sprite.setPosition(displayX, displayY);
            }

            sprite.id = elemento.id;
            sprite.setData('elementId', elemento.id);
            sprite.setData('elementZ', elemento.z);
            sprite.setData('elementClass', elemento.clase);
            sprite.setData('elementTeam', elemento.tipoEquipo);

            const esLocal = this.esElementoPropio(elemento);
            
            // Hacer interactivo para unidades propias, pero no para enemigos (para evitar confusión al hacer click en enemigos para disparar)
            sprite.setInteractive({ useHandCursor: true });
            sprite.removeAllListeners('pointerdown');
            
            if (esLocal) {
                // Unidades propias: comportamiento de selección/control
                if (elemento.clase === 'DRON') {
                    sprite.on('pointerdown', () => {
                        // Simplemente cambiar para controlar este dron
                        this.seleccionarDron(sprite);
                    });
                } else if (elemento.clase === 'PORTADRON') {
                    sprite.on('pointerdown', () => {
                        // En modo dron: hacer clic en el portador no hace nada (usar zona de recarga en su lugar)
                        if (this.controlMode === 'DRON') {
                            console.log('Clic: Porter clickeado en modo dron - usa tecla R o clic en zona de recarga verde');
                            return;
                        }
                        // En modo portador: desplegar dron
                        if (this.controlMode === 'PORTADRONES') {
                            console.log('Clic: Se hizo clic en elemento porter, desplegando dron');
                            this.solicitarDesplegarDron();
                            return;
                        }
                        this.seleccionarPortadron(sprite);
                    });
                }
            } else {
                // Unidades enemigas: mantener interactividad para disparar - manejado por pointerdown global
                // El manejador global en la línea 262 procesará los clics en las unidades enemigas para disparar
            }

            sprite.setAngle(elemento.angulo);
            if (elemento.clase === 'PORTADRON') {
                const anchoBasePorta = 110;
                const altoBasePorta = 52;
                sprite.setDisplaySize(anchoBasePorta * factorTamano, altoBasePorta * factorTamano);
            } else {
                let anchoBaseDron = 28;
                let altoBaseDron = 28;
                if (elemento.tipoEquipo === 'NAVAL') {
                    anchoBaseDron = 34;
                    altoBaseDron = 22;
                }
                sprite.setDisplaySize(anchoBaseDron * factorTamano, altoBaseDron * factorTamano);
            }

            let depthBase = Number(elemento.z) || 0;
            if (elemento.clase === 'DRON') {
                depthBase += 0.5;
                // Make own drones always visible (above fog) so they're visible when controlling porter
                if (this.esElementoPropio(elemento) && this.esEstadoActivo(elemento.estado)) {
                    depthBase += 9500; // Above fog layer (9000)
                }
            }
            sprite.setDepth(depthBase);

            let label = this.elementosLabels.get(id);
            const info = this.obtenerEtiquetaElementoMasLinda(elemento);
            const ocultarEtiquetaDronDockeado = elemento.clase === 'DRON' && this.debeMostrarDronSobrePortadron(elemento);
            if (ocultarEtiquetaDronDockeado) {
                if (label) {
                    label.destroy();
                    this.elementosLabels.delete(id);
                }
            } else {
                if (!label) {
                    label = this.add.text(displayX, displayY - 20, info, {
                        font: 'bold 14px Arial',
                        fill: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 4,
                        backgroundColor: '#00000066'
                    });
                    label.setOrigin(0.5, 1);
                    this.elementosLabels.set(id, label);
                } else {
                    label.setText(info);
                    label.setPosition(displayX, displayY - 20);
                }

                label.setDepth(depthBase + 1);
            }

            if (elemento.clase === 'PORTADRON') {
                // Portadrones muestran vida-based health bar
                this.actualizarLifebarPortadron(elemento, sprite, id);
                this.ocultarBarraBateria(id);
            } else if (elemento.clase === 'DRON') {
                // Drones batería bar como "health bar" - solo para drones propios
                this.ocultarLifebar(id);
                if (this.esElementoPropio(elemento)) {
                    this.actualizarBarraBateriaDron(elemento, sprite, id);
                } else {
                    this.ocultarBarraBateria(id);
                }
            }
            this.aplicarAparienciaEquipo(sprite, elemento.tipoEquipo, elemento.clase);
        });
    }

    esEstadoActivo(estado) {
        if (!estado) {
            return false;
        }

        const estadoNormalizado = String(estado).toUpperCase();
        if (estadoNormalizado === 'ACTIVO') {
            return true;
        }
        if (estadoNormalizado === 'ACTIVE') {
            return true;
        }

        return false;
    }

    ocultarElemento(id) {
        const sprite = this.elementosSprites.get(id);
        if (sprite) {
            sprite.destroy();
            this.elementosSprites.delete(id);
        }

        const label = this.elementosLabels.get(id);
        if (label) {
            label.destroy();
            this.elementosLabels.delete(id);
        }

        this.ocultarLifebar(id);
        this.ocultarBarraBateria(id);
    }

    ocultarLifebar(id) {
        const barra = this.elementosLifebars.get(id);
        if (!barra) {
            return;
        }

        if (barra.fondo) {
            barra.fondo.destroy();
        }
        if (barra.relleno) {
            barra.relleno.destroy();
        }
        this.elementosLifebars.delete(id);
    }

    ocultarBarraBateria(id) {
        const barra = this.elementosBateriabars.get(id);
        if (!barra) {
            return;
        }

        if (barra.fondo) {
            barra.fondo.destroy();
        }
        if (barra.relleno) {
            barra.relleno.destroy();
        }
        this.elementosBateriabars.delete(id);
    }

    obtenerColorVida(vida) {
        const vidaNum = Number(vida) || 0;
        if (vidaNum >= 70) {
            return 0x00ff00;
        }
        if (vidaNum >= 40) {
            return 0xffff00;
        }
        return 0xff0000;
    }

    obtenerColorBateria(bateria) {
        const bateriaNum = Number(bateria) || 0;
        if (bateriaNum >= 70) {
            return 0x58e35d;
        }
        if (bateriaNum >= 40) {
            return 0xffd54f;
        }
        return 0xff6b6b;
    }

    actualizarLifebarPortadron(elemento, sprite, keyElemento) {
        // Determina la vida máxima según el tipo de elemento
        let maxVida = 100; // Por defecto para drones
        if (elemento.clase === 'PORTADRON') {
            if (elemento.tipoEquipo === 'AEREO') {
                maxVida = 1000; // Portadron Aéreo (antes era 600)
            } else {
                maxVida = 800; // Portadron Naval (antes era 300)
            }
        }
        
        const vida = Number(elemento.vida) || 0;
        const vidaClamped = Phaser.Math.Clamp(vida, 0, maxVida);
        const porcentaje = vidaClamped / maxVida;
        
        // LOG para depuración de health bars, especialmente para portadrones
        if (elemento.clase === 'PORTADRON') {
            try {
                console.log(`BARRA DE SALUD: Porter ${elemento.id} barra de salud:`, {
                    vida: vida,
                    maxVida: maxVida,
                    porcentaje: (porcentaje * 100).toFixed(1) + '%',
                    tipoEquipo: elemento.tipoEquipo || 'UNKNOWN',
                    estado: elemento.estado || 'UNKNOWN',
                    keyElemento: keyElemento
                });
            } catch (err) {
                console.error('BARRA DE SALUD: Error en log:', err);
            }
        }

        const width = 64;
        const height = 7;
        const x = sprite.x - (width / 2);
        const y = sprite.y - (40 * sprite.scaleY) - 12;
        const colorVida = this.obtenerColorVida(vidaClamped);

        let barra = this.elementosLifebars.get(keyElemento);
        if (!barra) {
            barra = {
                fondo: this.add.graphics(),
                relleno: this.add.graphics()
            };
            this.elementosLifebars.set(keyElemento, barra);
        }

        barra.fondo.clear();
        barra.fondo.fillStyle(0x000000, 0.75);
        barra.fondo.fillRect(x - 1, y - 1, width + 2, height + 2);
        barra.fondo.lineStyle(1, 0xffffff, 0.7);
        barra.fondo.strokeRect(x - 1, y - 1, width + 2, height + 2);

        barra.relleno.clear();
        barra.relleno.fillStyle(colorVida, 1);
        barra.relleno.fillRect(x, y, width * porcentaje, height);

        const depthBase = (Number(elemento.z) || 0) + 2;
        barra.fondo.setDepth(depthBase);
        barra.relleno.setDepth(depthBase + 0.1);
    }

    actualizarBarraBateriaDron(elemento, sprite, keyElemento) {
        // Los drones muestran la batería como su barra principal de "salud" (mueren de un solo golpe, por lo que la vida no importa)
        const maxBateria = 100;
        const bateria = Number(elemento.bateria) || 0;
        const bateriaClamped = Phaser.Math.Clamp(bateria, 0, maxBateria);
        const porcentaje = bateriaClamped / maxBateria;

        // Barra más grande como las barras de salud de los portadrones, centrada sobre el dron
        const width = 50;
        const height = 6;
        const x = sprite.x - (width / 2);
        const y = sprite.y - (25 * sprite.scaleY) - 8;
        const colorBateria = this.obtenerColorBateria(bateriaClamped);

        let barra = this.elementosBateriabars.get(keyElemento);
        if (!barra) {
            barra = {
                fondo: this.add.graphics(),
                relleno: this.add.graphics()
            };
            this.elementosBateriabars.set(keyElemento, barra);
        }

        barra.fondo.clear();
        barra.fondo.fillStyle(0x000000, 0.75);
        barra.fondo.fillRect(x - 1, y - 1, width + 2, height + 2);
        barra.fondo.lineStyle(1, 0xffffff, 0.7);
        barra.fondo.strokeRect(x - 1, y - 1, width + 2, height + 2);

        barra.relleno.clear();
        barra.relleno.fillStyle(colorBateria, 1);
        barra.relleno.fillRect(x, y, width * porcentaje, height);

        const depthBase = (Number(elemento.z) || 0) + 2;
        barra.fondo.setDepth(depthBase);
        barra.relleno.setDepth(depthBase + 0.1);
    }

    actualizarRealidad(data) {
        if (!data) {
            return;
        }
        
        // DEBUG: Registrar si la actualizacion de realidad llega durante recarga pendiente
        if (this.pendingRechargeRequest) {
            console.warn(`%cUPDATE: Actualizacion de realidad llego DURANTE recarga pendiente`, 'color: #ff9900; font-weight: bold', {
                pendingDrone: this.pendingRechargeRequest.dronId,
                pendingPorter: this.pendingRechargeRequest.portadronId,
                elementsCount: data.elementos?.length || 0,
                timestamp: new Date().toLocaleTimeString()
            });
        }

        let huboActualizacionProyectiles = false;

        if (Array.isArray(data.proyectiles)) {
            this.actualizarProyectilesDesdeLista(data.proyectiles);
            huboActualizacionProyectiles = true;
        }

        if (Array.isArray(data.elementos)) {
            data.elementos.forEach((e) => {
                if (!e) {
                    return;
                }

                if (this.esElementoProyectil(e)) {
                    this.actualizarProyectilDesdeElemento(e);
                    return;
                }

                const claveExistente = this.buscarClaveExistentePorId(e.id);
                const claveBackendExistente = this.buscarClaveBackendExistentePorId(e.id);
                const existenteBackend = this.elementosBackendEstado.get(claveBackendExistente) || {};
                const existenteFrontend = this.elementosEstado.get(claveExistente) || {};
                const vidaAnterior = Number(existenteBackend.vida);
                
                // Escalar vida del backend (backend usa 100 como maximo para todos los elementos)
                let vidaBackend;
                if (e.vida !== undefined && e.vida !== null) {
                    vidaBackend = Number(e.vida);
                } else if (existenteBackend.vida !== undefined && existenteBackend.vida !== null) {
                    vidaBackend = Number(existenteBackend.vida);
                } else {
                    vidaBackend = 0;
                }
                let vidaEscalada = vidaBackend;
                
                // Determinar tipo de elemento para escalado
                let clase;
                if (e.clase) {
                    clase = e.clase;
                } else if (existenteBackend.clase) {
                    clase = existenteBackend.clase;
                } else {
                    clase = 'DRON';
                }
                
                let tipoEquipo;
                if (e.tipoEquipo) {
                    tipoEquipo = e.tipoEquipo;
                } else if (existenteBackend.tipoEquipo) {
                    tipoEquipo = existenteBackend.tipoEquipo;
                } else {
                    tipoEquipo = 'NAVAL';
                }
                
                // IMPORTANTE: ESCALADO DE VIDA ES SOLO COSMETICO - EL BACKEND SIGUE USANDO 100 MAX
                // El frontend escala vida para DISPLAY, pero el backend toma decisiones de destruccion usando 100 como max
                // ESTO CAUSA QUE PORTERS MUERAN EN 1-2 GOLPES A PESAR DE MOSTRAR 1000 800 HP
                // FIX REQUERIDO EN BACKEND: Backend debe usar maxVida diferente por tipo:
                //    - PORTADRON AEREO: 1000 HP real (no 100)
                //    - PORTADRON NAVAL: 800 HP real (no 100)
                //    - DRON: 100 HP (sin cambio)
                if (clase === 'PORTADRON') {
                    if (tipoEquipo === 'AEREO') {
                        vidaEscalada = vidaBackend * 10; // 1000 HP máximo para Portadron Aéreo (SOLO DISPLAY)
                    } else {
                        vidaEscalada = vidaBackend * 8; // 800 HP máximo para Portadron Naval (SOLO DISPLAY)
                    }
                    
                    // DEBUG: Registrar actualizaciones de salud del porter para rastrear daño
                    if (vidaEscalada !== vidaAnterior) {
                        console.log(`PORTER VIDA: Porter ID ${e.id} actualizacion de salud:`, {
                            vidaAnterior,
                            vidaBackend: vidaBackend,
                            vidaEscalada: vidaEscalada,
                            damage: vidaAnterior - vidaEscalada,
                            estado: e.estado,
                            tipoEquipo
                        });
                        
                        // Advertir si el porter esta a punto de morir desde perspectiva del backend (salud backend baja)
                        if (vidaBackend <= 30 && vidaBackend > 0) {
                            const maxHP = tipoEquipo === 'AEREO' ? 1000 : 800;
                            console.error(`%cPORTER VIDA: ADVERTENCIA DE SALUD CRITICA`, 'color: #ff0000; font-size: 16px; font-weight: bold');
                            console.error(`PORTER VIDA: Porter ${e.id} BACKEND: ${vidaBackend}/100 HP | FRONTEND DISPLAY: ${vidaEscalada}/${maxHP} HP`);
                            console.error(`PORTER VIDA: El backend marcara DESTRUIDO a 0 HP backend. Un impacto mas (~10-15 dano) podria ser fatal`);
                            console.error(`PORTER VIDA: La barra de salud del frontend es ENGANOSA - muestra ${((vidaEscalada/maxHP)*100).toFixed(1)}% pero el backend esta al ${vidaBackend}%`);
                        }
                    }
                }
                // Los drones mantienen la misma escala (100 HP máximo)
                
                // Para bateria, el backend tambien usa 100 como maximo para todos los drones, asi que no necesitamos escalar, pero si asegurarnos de confiar en el valor del backend si esta presente, ya que el frontend podria no tenerlo actualizado correctamente especialmente despues de desplegar un dron desde un portador
                // Backend es autoritativo; el drenaje en el frontend es solo para suavizar visualmente entre actualizaciones
                let bateriaValue;
                if (e.bateria !== undefined && e.bateria !== null) {
                    // Backend envio valor de bateria - SIEMPRE confiar en el
                    bateriaValue = Number(e.bateria);
                } else {
                    // Backend no envio bateria, usar valor existente
                    if (existenteBackend.bateria !== undefined && existenteBackend.bateria !== null) {
                        bateriaValue = Number(existenteBackend.bateria);
                    } else if (existenteFrontend.bateria !== undefined && existenteFrontend.bateria !== null) {
                        bateriaValue = Number(existenteFrontend.bateria);
                    } else {
                        bateriaValue = 100;
                    }
                }
                
                let xValue;
                if (e.x !== undefined && e.x !== null) {
                    xValue = Number(e.x);
                } else if (e.posicionX !== undefined && e.posicionX !== null) {
                    xValue = Number(e.posicionX);
                } else if (existenteBackend.x !== undefined && existenteBackend.x !== null) {
                    xValue = Number(existenteBackend.x);
                } else {
                    xValue = 0;
                }
                
                let yValue;
                if (e.y !== undefined && e.y !== null) {
                    yValue = Number(e.y);
                } else if (e.posicionY !== undefined && e.posicionY !== null) {
                    yValue = Number(e.posicionY);
                } else if (existenteBackend.y !== undefined && existenteBackend.y !== null) {
                    yValue = Number(existenteBackend.y);
                } else {
                    yValue = 0;
                }
                
                let zValue;
                if (e.z !== undefined && e.z !== null) {
                    zValue = Number(e.z);
                } else if (e.posicionZ !== undefined && e.posicionZ !== null) {
                    zValue = Number(e.posicionZ);
                } else if (existenteBackend.z !== undefined && existenteBackend.z !== null) {
                    zValue = Number(existenteBackend.z);
                } else {
                    zValue = 0;
                }
                
                let anguloValue;
                if (e.angulo !== undefined && e.angulo !== null) {
                    anguloValue = Number(e.angulo);
                } else if (existenteBackend.angulo !== undefined && existenteBackend.angulo !== null) {
                    anguloValue = Number(existenteBackend.angulo);
                } else {
                    anguloValue = 0;
                }
                
                const actualizado = {
                    ...existenteBackend,
                    id: e.id,
                    x: xValue,
                    y: yValue,
                    z: zValue,
                    angulo: anguloValue,
                    vida: vidaEscalada,
                    estado: e.estado || existenteBackend.estado || 'ACTIVO',
                    bateria: bateriaValue,
                    tipoMunicion: e.tipoMunicion || existenteBackend.tipoMunicion
                };
                
                // Calcular municionDisponible con lógica explícita
                let municionDisponibleValue;
                if (e.municionDisponible !== undefined && e.municionDisponible !== null) {
                    municionDisponibleValue = Number(e.municionDisponible);
                } else if (e.municion !== undefined && e.municion !== null) {
                    municionDisponibleValue = Number(e.municion);
                } else if (e.cantidadMunicionesDisponibles !== undefined && e.cantidadMunicionesDisponibles !== null) {
                    municionDisponibleValue = Number(e.cantidadMunicionesDisponibles);
                } else if (existenteBackend.municionDisponible !== undefined && existenteBackend.municionDisponible !== null) {
                    municionDisponibleValue = Number(existenteBackend.municionDisponible);
                } else {
                    municionDisponibleValue = 0;
                }
                actualizado.municionDisponible = municionDisponibleValue;

                // CRITICO: Validar destruccion de portador antes de aceptar estado DESTRUIDO
                // Solo sobrescribir DESTRUIDO si tenemos datos confiables de salud mostrando que el portador deberia estar vivo
                if (actualizado.clase === 'PORTADRON' && actualizado.estado === 'DESTRUIDO') {
                    // Verificar si recibimos datos frescos de vida del backend en esta actualizacion
                    const receivedVidaUpdate = (e.vida !== undefined && e.vida !== null) || (e.Vida !== undefined && e.Vida !== null);
                    
                    console.error(`%cUPDATE: El backend envio DESTRUIDO para Porter ${actualizado.id}`, 'color: #ff0000; font-size: 14px; font-weight: bold', {
                        porterId: actualizado.id,
                        backendVida: vidaBackend,
                        scaledVida: vidaEscalada,
                        receivedVidaUpdate: receivedVidaUpdate,
                        tipoEquipo: actualizado.tipoEquipo,
                        clase: actualizado.clase,
                        timestamp: new Date().toLocaleTimeString(),
                        pendingRecharge: this.pendingRechargeRequest ? `SI - Dron ${this.pendingRechargeRequest.dronId}` : 'NO'
                    });
                    
                    // Solo anular si obtuvimos datos frescos de vida Y muestra vida > 0
                    // Esto previene usar valores de vida obsoletos/en cache para anular incorrectamente la destruccion
                    if (receivedVidaUpdate && vidaEscalada > 0) {
                        console.error(`UPDATE: BUG DEL BACKEND: Porter ${actualizado.id} envio vida=${vidaBackend} (escalado: ${vidaEscalada}) pero marcado DESTRUIDO. Forzando estado=ACTIVO`);
                        // Anular el estado DESTRUIDO incorrecto del backend
                        actualizado.estado = 'ACTIVO';
                    } else if (!receivedVidaUpdate) {
                        console.log(`UPDATE: Porter ${actualizado.id} destruido - sin datos frescos de vida, confiando en DESTRUIDO del backend`);
                    } else {
                        console.log(`UPDATE: Porter ${actualizado.id} legitimamente destruido (vida=${vidaEscalada})`);
                    }
                }

                if (!actualizado.clase) {
                    actualizado.clase = clase;
                }
                if (!actualizado.tipoEquipo) {
                    actualizado.tipoEquipo = tipoEquipo;
                }

                const claveActualizada = this.obtenerClaveElemento(actualizado);
                if (claveExistente && claveExistente !== claveActualizada) {
                    this.elementosEstado.delete(claveExistente);
                }
                if (claveBackendExistente && claveBackendExistente !== claveActualizada) {
                    this.elementosBackendEstado.delete(claveBackendExistente);
                }

                if (
                    actualizado.clase === 'PORTADRON' &&
                    this.ownPortadronId !== null &&
                    this.ownPortadronId !== undefined &&
                    String(actualizado.id) === String(this.ownPortadronId)
                ) {
                    const vidaActual = Number(actualizado.vida);
                    if (Number.isFinite(vidaAnterior) && Number.isFinite(vidaActual) && vidaActual < vidaAnterior) {
                        this.marcarPortadronBajoAtaque();
                    }
                }

                this.elementosEstado.set(claveActualizada, actualizado);
                this.elementosBackendEstado.set(claveActualizada, { ...actualizado });
            });

            this.renderizarElementos();
            this.renderizarProyectiles();
            this.actualizarListaDronesActivos(); // Actualizar lista de drones activos
            this.colocarUnidadSegunEquipo();
            if (this.controlMode === 'DRON') {
                this.actualizarHUDDesdeDronActivo();
            } else {
                this.actualizarHUDDesdePortadronActivo(this.unit);
            }
            this.dibujarVision();
            this.actualizarMiniMapa();
            this.actualizarIndicadorPortadron();
            return;
        }

        if (huboActualizacionProyectiles) {
            this.renderizarProyectiles();
        }
    }

    esElementoProyectil(e) {
        const clase = String(e.clase || e.tipo || e.tipoElemento || '').toUpperCase();
        if (clase === 'MISIL' || clase === 'BOMBA') {
            return true;
        }

        if (e.alcance !== undefined || e.velocidad !== undefined) {
            return true;
        }

        if (e.radioExplosion !== undefined) {
            return true;
        }

        return false;
    }

    normalizarTipoProyectil(e) {
        const clase = String(e.clase || e.tipo || e.tipoElemento || '').toUpperCase();
        if (clase === 'BOMBA') {
            return 'BOMBA';
        }
        if (clase === 'MISIL') {
            return 'MISIL';
        }
        if (e.radioExplosion !== undefined) {
            return 'BOMBA';
        }
        return 'MISIL';
    }

    actualizarProyectilesDesdeLista(listaProyectiles) {
        listaProyectiles.forEach((proy) => {
            this.actualizarProyectilDesdeElemento(proy);
        });
    }

    actualizarProyectilDesdeElemento(e) {
        if (!e || e.id === undefined || e.id === null) {
            return;
        }

        const id = Number(e.id);
        const existente = this.proyectilesEstado.get(id) || {};
        
        // z solo se usa para ordenamiento de visualización, NO para lógica de trayectoria
        let zDisplay;
        if (e.z !== undefined && e.z !== null) {
            zDisplay = Number(e.z);
        } else if (e.posicionZ !== undefined && e.posicionZ !== null) {
            zDisplay = Number(e.posicionZ);
        } else if (existente.zDisplay !== undefined) {
            zDisplay = existente.zDisplay;
        } else {
            zDisplay = 50;
        }
        
        // duracion determina cuánto tiempo el proyectil estará en el aire (en milisegundos)
        let duracion;
        if (e.duracion !== undefined && e.duracion !== null) {
            duracion = Number(e.duracion);
        } else if (e.tiempoVuelo !== undefined && e.tiempoVuelo !== null) {
            duracion = Number(e.tiempoVuelo);
        } else if (existente.duracion !== undefined) {
            duracion = existente.duracion;
        } else {
            // Duración por defecto si backend no la envía
            if (this.normalizarTipoProyectil(e) === 'BOMBA') {
                duracion = 1500;
            } else {
                duracion = 3000;
            }
        }
        
        const actualizado = {
            ...existente,
            id: id,
            clase: this.normalizarTipoProyectil(e),
            startX: existente.startX || Number(e.x || e.posicionX || 0),
            startY: existente.startY || Number(e.y || e.posicionY || 0),
            targetX: Number(e.targetX || e.objetivoX || existente.targetX || existente.startX || 0),
            targetY: Number(e.targetY || e.objetivoY || existente.targetY || existente.startY || 0),
            zDisplay: zDisplay,
            angulo: Number(e.angulo || existente.angulo || 0),
            estado: e.estado || existente.estado || 'ACTIVO',
            tipoEquipo: e.tipoEquipo || existente.tipoEquipo || null,
            duracion: duracion,
            startTime: existente.startTime || Date.now(),
            velocidad: Number(e.velocidad || existente.velocidad || 0),
            alcance: Number(e.alcance || existente.alcance || 0),
            radioExplosion: Number(e.radioExplosion || existente.radioExplosion || 0)
        };

        if (!this.esEstadoActivo(actualizado.estado)) {
            this.ocultarProyectil(id);
            this.proyectilesEstado.delete(id);
            return;
        }

        this.proyectilesEstado.set(id, actualizado);
    }

    renderizarProyectiles() {
        const now = Date.now();
        
        this.proyectilesEstado.forEach((proyectil, id) => {
            if (!this.esEstadoActivo(proyectil.estado)) {
                this.ocultarProyectil(id);
                this.proyectilesEstado.delete(id);
                return;
            }

            // Calcular progreso basado en tiempo transcurrido y duracion
            const tiempoTranscurrido = now - (proyectil.startTime || now);
            const progreso = Math.min(tiempoTranscurrido / proyectil.duracion, 1.0);
            
            // Calcular posicion actual basada en interpolacion lineal (frontend-free de backend)
            const currentX = proyectil.startX + (proyectil.targetX - proyectil.startX) * progreso;
            const currentY = proyectil.startY + (proyectil.targetY - proyectil.startY) * progreso;
            
            // Si el proyectil completó su trayectoria, marcar como destruido
            if (progreso >= 1.0 && proyectil.estado === 'ACTIVO') {
                proyectil.estado = 'DESTRUIDO';
                this.proyectilesEstado.set(id, proyectil);
            }

            let sprite = this.proyectilesSprites.get(id);
            let textura;
            if (proyectil.clase === 'BOMBA') {
                textura = 'proyectil_bomba';
            } else {
                textura = 'proyectil_misil';
            }
            let anchoBase;
            if (proyectil.clase === 'BOMBA') {
                anchoBase = 20;
            } else {
                anchoBase = 34;
            }
            let altoBase;
            if (proyectil.clase === 'BOMBA') {
                altoBase = 20;
            } else {
                altoBase = 14;
            }

            if (!sprite) {
                sprite = this.add.sprite(currentX, currentY, textura);
                this.proyectilesSprites.set(id, sprite);
            } else if (sprite.setTexture) {
                sprite.setTexture(textura);
            } else {
                sprite.destroy();
                sprite = this.add.sprite(currentX, currentY, textura);
                this.proyectilesSprites.set(id, sprite);
            }

            sprite.setPosition(currentX, currentY);
            sprite.setAngle(proyectil.angulo || 0);

            // Usar escalado basado en PROGRESO para simular acercamiento/alejamiento (proyectiles parecen más grandes a medida que se acercan al objetivo)
            const factor = this.obtenerFactorTamanoProyectilPorProgreso(progreso, proyectil.clase);
            sprite.setDisplaySize(anchoBase * factor, altoBase * factor);
            
            // Display SOLO para ordenamiento visual (altura), NO para lógica
            sprite.setDepth((Number(proyectil.zDisplay) || 50) + 0.8);
            
            // Chequear si el proyectil alcanzó el destino sin impactar nada
            if (proyectil.estado === 'DESTRUIDO') {
                // Disparar efecto apropiado
                if (proyectil.clase === 'BOMBA') {
                    this.showWaterSplashEffect(currentX, currentY);
                } else {
                    this.showAirExplosionEffect(currentX, currentY, proyectil.zDisplay);
                }
            }
        });
    }

    showWaterSplashEffect(x, y) {
        // Efecto de salpicadura de agua en vista lateral cuando la bomba falla
        const splash = this.add.sprite(x, y, 'proyectil_bomba');
        splash.setScale(2.5);
        splash.setDepth(10000); // Por encima de todo
        splash.setTint(0x4488ff); // Tinte azul para la salpicadura de agua
        
        const splashFrames = [];
        for (let i = 0; i < 10; i++) {
            splashFrames.push('fire' + String(i).padStart(2, '0'));
        }
        
        this.tweens.add({
            targets: splash,
            alpha: 0,
            scaleX: 3.5,
            scaleY: 3.5,
            duration: 600,
            ease: 'Power2',
            onComplete: () => splash.destroy()
        });
    }

    showAirExplosionEffect(x, y, z) {
        // Efecto de explosión cuando misil no le da a nada (explosión aérea)
        const explosion = this.add.sprite(x, y, 'proyectil_bomba');
        explosion.setScale(2.0);
        explosion.setDepth(10000); // Arriba del todo
        explosion.setTint(0xff8800); // Naranja para explosión aérea
        
        // ANIMACIÓN: Cambiar textura para simular animación de explosión (usando frames de fuego)
        let frame = 0;
        const animInterval = setInterval(() => {
            if (frame < 20 && explosion.active) {
                explosion.setTexture('fire' + String(frame).padStart(2, '0'));
                frame++;
            } else {
                clearInterval(animInterval);
                if (explosion.active) {
                    explosion.destroy();
                }
            }
        }, 50);
        
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scaleX: 3.0,
            scaleY: 3.0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                clearInterval(animInterval);
                if (explosion.active) {
                    explosion.destroy();
                }
            }
        });
    }

    ocultarProyectil(id) {
        const sprite = this.proyectilesSprites.get(id);
        if (sprite) {
            sprite.destroy();
            this.proyectilesSprites.delete(id);
        }
    }

    dibujarVision() {
        if (!this.visionCircle || !this.visionRange) return;
        this.visionCircle.clear();
       //Esto tiene que venir del backend luego
        this.visionCircle.fillStyle(0xffffff, 1);
        let target = this.unit;
        if (this.controlMode === 'DRON' && this.activeDron) {
            target = this.activeDron;
        }
        if (target) {
            const camera = this.cameras.main;
            const screenX = target.x - camera.scrollX;
            const screenY = target.y - camera.scrollY;
            this.visionCircle.fillCircle(screenX, screenY, this.visionRange);
        }
    }

    solicitarLanzarDron() { this.enviarAlSocket({ Tipo: "LANZAR_DRON" }); }

    /**
     * TEMPORARIO: Drenar batería de los drones activos en el frontend
     * Esto simula el drenaje de batería del backend hasta que GameLoop lo implemente
     * La batería se drena linealmente durante 60 segundos (100% -> 0%)
     */
    aplicarDrenajeTemporalBateria() {
        if (!this.lastBatteryDrainTime) {
            this.lastBatteryDrainTime = Date.now();
            return;
        }
        
        const now = Date.now();
        const deltaTime = now - this.lastBatteryDrainTime;
        this.lastBatteryDrainTime = now;
        
        // Tasa de drenaje: 100% en 60 segundos = ~1.67% por segundo
        const drainPerSecond = 100 / 60;
        const drainAmount = (drainPerSecond * deltaTime) / 1000;
        
        let hudNeedsUpdate = false;
        
        this.elementosEstado.forEach((elemento, clave) => {
            if (elemento.clase !== 'DRON') {
                return;
            }
            
            // Solo drenar drones realmente desplegados (estado ACTIVO Y z > 0)
            if (elemento.estado !== 'ACTIVO') {
                return;
            }
            
            const droneZ = Number(elemento.z);
            if (!Number.isFinite(droneZ) || droneZ <= 0) {
                return; // Saltar drones dentro del portador
            }
            
            if (!this.esElementoPropio(elemento)) {
                return;
            }
            
            let bateriaActual = Number(elemento.bateria);
            if (!Number.isFinite(bateriaActual)) {
                bateriaActual = 100;
            }
            
            if (bateriaActual <= 0) {
                return; // Ya vacía, el backend manejará el estado DESTRUIDO
            }
            
            // Aplicar drenaje visual (el backend corregirá en la próxima actualización)
            const nuevaBateria = Math.max(0, bateriaActual - drainAmount);
            elemento.bateria = nuevaBateria;
            
            // Actualizar barra de batería visual inmediatamente
            const sprite = this.elementosSprites.get(clave);
            if (sprite) {
                this.actualizarBarraBateriaDron(elemento, sprite, clave);
            }
            
            // Chequear si este es el dron activo para actualizar HUD
            if (this.controlMode === 'DRON' && this.activeDron) {
                const activeDronId = this.activeDron.getData('elementId') || this.activeDron.id;
                if (String(elemento.id) === String(activeDronId)) {
                    hudNeedsUpdate = true;
                }
            }
            
            // Nota: Backend es autoritativo para transicion bateria=0 a DESTRUIDO
            // Frontend solo proporciona drenaje visual suave entre actualizaciones del backend
        });
        
        // Actualizar HUD si se controla un dron con bateria agotada
        if (hudNeedsUpdate && this.controlMode === 'DRON') {
            this.actualizarHUDDesdeDronActivo();
        }
    }
    
    /**
     * Obtener chequeo de sprite del portadron propio para efectos como mostrar indicador de ataque
     */
    obtenerPortadronPropioSprite() {
        if (!this.ownPortadronId) {
            return null;
        }
        
        let porterSprite = null;
        this.elementosSprites.forEach((sprite, clave) => {
            if (porterSprite) {
                return;
            }
            
            const elemento = this.elementosEstado.get(clave);
            if (!elemento) {
                return;
            }
            
            if (elemento.clase !== 'PORTADRON') {
                return;
            }
            
            if (String(elemento.id) === String(this.ownPortadronId)) {
                porterSprite = sprite;
            }
        });
        
        return porterSprite;
    }
    
    /**
     * Crear animación de proyectil cuando el disparo es confirmado
     * Backend-free: La trayectoria se calcula localmente basada en duración
     */
    crearProyectilTemporal(duracionBackend = null) {
        if (!this.pendingShotRequest) {
            console.log('Disparo: Sin solicitud de disparo pendiente para animar');
            return;
        }
        
        const dronId = this.pendingShotRequest.dronId;
        const clave = this.buscarClaveBackendExistentePorId(dronId);
        let dronEstado;
        if (clave) {
            dronEstado = this.elementosBackendEstado.get(clave);
        } else {
            dronEstado = null;
        }
        
        if (!dronEstado) {
            console.log('Disparo: No se puede encontrar estado del dron para proyectil');
            return;
        }
        
        // Determinar tipo de munición
        let tipoMunicion = 'MISIL';
        if (dronEstado.tipoEquipo === 'AEREO') {
            tipoMunicion = 'BOMBA';
        }
        if (String(dronEstado.tipoMunicion || '').toUpperCase() === 'BOMBA') {
            tipoMunicion = 'BOMBA';
        }
        if (String(dronEstado.tipoMunicion || '').toUpperCase() === 'MISIL') {
            tipoMunicion = 'MISIL';
        }
        
        console.log(`Disparo: Creando proyectil ${tipoMunicion} temporal`);
        
        // Crear ID temporal para el proyectil
        const proyectilId = Date.now() + Math.floor(Math.random() * 1000);
        
        if (tipoMunicion === 'BOMBA') {
            this.crearAnimacionBombaTemporal(proyectilId, dronEstado, duracionBackend);
        } else {
            this.crearAnimacionMisilTemporal(proyectilId, dronEstado, duracionBackend);
        }
    }
    
    /**
     * Animar bomba cayendo desde la posición del dron hasta el objetivo
     * Usa solo duración para la animación
     */
    crearAnimacionBombaTemporal(proyectilId, dronEstado, duracionBackend = null) {
        const startX = Number(dronEstado.x);
        const startY = Number(dronEstado.y);
        const startZ = Number(dronEstado.z);
        
        // El objetivo es donde el usuario hizo clic
        const targetX = this.pendingShotRequest?.clickX || startX;
        const targetY = this.pendingShotRequest?.clickY || startY;
        
        // Usar duración del backend si está disponible, sino usar default
        const duracion = duracionBackend || 1500; // Bombas caen en 1.5 segundos por defecto
        
        const proyectilEstado = {
            id: proyectilId,
            clase: 'BOMBA',
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            zDisplay: startZ, // Solo para ordenamiento visual
            angulo: 0,
            estado: 'ACTIVO',
            tipoEquipo: dronEstado.tipoEquipo,
            duracion: duracion,
            startTime: Date.now()
        };
        
        this.proyectilesEstado.set(proyectilId, proyectilEstado);
        
        console.log(`Disparo: Bomba creada desde (${startX}, ${startY}) hacia (${targetX}, ${targetY}), duracion ${duracion}ms`);
        
        // La renderización y escalado son manejados por renderizarProyectiles()
        // que calcula posición basada en tiempo/duración
        
        // Programar explosión al final
        setTimeout(() => {
            if (this.proyectilesEstado.has(proyectilId)) {
                const finalProyectil = this.proyectilesEstado.get(proyectilId);
                this.crearExplosionTemporal(finalProyectil.targetX, finalProyectil.targetY, 80);
                this.proyectilesEstado.delete(proyectilId);
                const sprite = this.proyectilesSprites.get(proyectilId);
                if (sprite) {
                    sprite.destroy();
                    this.proyectilesSprites.delete(proyectilId);
                }
                console.log('Disparo: Explosion de bomba en el suelo');
            }
        }, duracion);
    }
    
    /**
     * Animar misil viajando desde el dron en la dirección de su ángulo
     * Usa solo duración para la animación
     */
    crearAnimacionMisilTemporal(proyectilId, dronEstado, duracionBackend = null) {
        const startX = Number(dronEstado.x);
        const startY = Number(dronEstado.y);
        const startZ = Number(dronEstado.z);
        const angulo = Number(dronEstado.angulo);
        
        // Usar duración del backend si está disponible, sino usar default
        const duracion = duracionBackend || 3000; // Misiles vuelan por 3 segundos por defecto
        
        // Calcular dirección de viaje desde el ángulo
        const radianes = Phaser.Math.DegToRad(angulo);
        const velocidad = 300;
        const distanciaRecorrida = velocidad * (duracion / 1000);
        const targetX = startX + Math.cos(radianes) * distanciaRecorrida;
        const targetY = startY + Math.sin(radianes) * distanciaRecorrida;
        
        const proyectilEstado = {
            id: proyectilId,
            clase: 'MISIL',
            startX: startX,
            startY: startY,
            targetX: targetX,
            targetY: targetY,
            zDisplay: startZ, // Solo para ordenamiento visual
            angulo: angulo,
            estado: 'ACTIVO',
            tipoEquipo: dronEstado.tipoEquipo,
            duracion: duracion,
            startTime: Date.now()
        };
        
        this.proyectilesEstado.set(proyectilId, proyectilEstado);
        
        console.log(`Disparo: Misil lanzado en angulo ${angulo} desde (${startX}, ${startY}) hacia (${targetX}, ${targetY}), duracion ${duracion}ms`);
        
        // La renderización y escalado ahora son manejados por renderizarProyectiles()
        // que calcula posición basada en tiempo/duración
        
        // Programar explosión al final
        setTimeout(() => {
            if (this.proyectilesEstado.has(proyectilId)) {
                const finalProyectil = this.proyectilesEstado.get(proyectilId);
                this.crearExplosionTemporal(finalProyectil.targetX, finalProyectil.targetY, 60);
                this.proyectilesEstado.delete(proyectilId);
                const sprite = this.proyectilesSprites.get(proyectilId);
                if (sprite) {
                    sprite.destroy();
                    this.proyectilesSprites.delete(proyectilId);
                }
                console.log('Disparo: Misil exploto despues de 3 segundos');
            }
        }, duracion);
    }
    
    /**
     * Crear efecto de partículas de explosión
     */
    crearExplosionTemporal(x, y, radio) {
        const explosion = this.add.particles(x, y, 'proyectil_bomba', {
            speed: { min: 100, max: 200 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff6600, 0xff0000, 0xffaa00],
            lifespan: 600,
            quantity: 15,
            blendMode: 'ADD',
            angle: { min: 0, max: 360 }
        });
        
        // Círculo para mostrar brevemente el radio de la explosión
        const circulo = this.add.circle(x, y, radio, 0xff6600, 0.3);
        circulo.setDepth(100);
        
        this.tweens.add({
            targets: circulo,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                circulo.destroy();
                explosion.destroy();
            }
        });
    }

    solicitarDesplegarDron() {
        // Arreglo para evitar múltiples clicks rápidos que envíen varias solicitudes de despliegue
        const now = Date.now();
        if (now - this.lastDeploymentTime < 500) {
            console.log("Solicitud de despliegue demasiado pronto, ignorando...");
            return;
        }
        
        const enviado = this.enviarAlSocket({ tipo: "DESPLEGAR_DRON" });
        if (enviado) {
            this.lastDeploymentTime = now;
            console.log("Solicitando desplegar siguiente dron...");
        }
    }

    /**
     * Actualiza la lista ordenada de drones activos propios
     */
    actualizarListaDronesActivos() {
        this.dronesActivosOrdenados = [];
        
        console.log(`Ciclo: === Actualizando lista de drones activos ===`);
        console.log(`Ciclo: elementosSprites size: ${this.elementosSprites.size}`);
        console.log(`Ciclo: elementosEstado size: ${this.elementosEstado.size}`);
        
        this.elementosSprites.forEach((sprite, clave) => {
            const elemento = this.elementosEstado.get(clave);
            if (!elemento) {
                console.log(`Ciclo: Omitido clave=${clave}: sin elemento en elementosEstado`);
                return;
            }
            
            if (elemento.clase !== 'DRON') {
                return; // Si no es dron, no nos interesa para esta lista
            }
            
            const esPropio = this.esElementoPropio(elemento);
            if (!esPropio) {
                console.log(`Ciclo: Omitido dron ID=${elemento.id}: no pertenece al jugador`);
                return;
            }
            
            // Solo drones que están como ACTIVO, explícitamente excluir DESTRUIDO
            const estadoUpper = String(elemento.estado).toUpperCase();
            if (estadoUpper === 'ACTIVO' || estadoUpper === 'ACTIVE') {
                this.dronesActivosOrdenados.push({
                    id: elemento.id,
                    sprite: sprite,
                    elemento: elemento
                });
                console.log(`Ciclo: Agregado dron activo: ID=${elemento.id}, estado=${elemento.estado}, tipo=${elemento.tipoElemento}, pos=(${elemento.x},${elemento.y})`);
            } else {
                console.log(`Ciclo: Omitido dron ID=${elemento.id}: estado=${elemento.estado} (no ACTIVO)`);
            }
        });
        
        // Ordenar por ID para cycling consistente
        this.dronesActivosOrdenados.sort((a, b) => Number(a.id) - Number(b.id));
        console.log(`Ciclo: === Total drones activos: ${this.dronesActivosOrdenados.length} ===`);
        console.log(`Ciclo: IDs: [${this.dronesActivosOrdenados.map(d => d.id).join(', ')}]`);
        
        // También actualizar el contador de drones en el HUD
        this.actualizarContadorDrones();
    }

    actualizarContadorDrones() {
        let totalDrones = 0;
        let aliveDrones = 0;
        
        this.elementosEstado.forEach((elemento) => {
            if (elemento.clase !== 'DRON') {
                return;
            }
            
            const esPropio = this.esElementoPropio(elemento);
            if (!esPropio) {
                return;
            }
            
            totalDrones++;
            // Contar todos los drones que NO están destruidos como vivos (incluye INACTIVO y ACTIVO)
            const estadoUpper = String(elemento.estado).toUpperCase();
            if (estadoUpper !== 'DESTRUIDO' && estadoUpper !== 'DESTROYED') {
                aliveDrones++;
            }
        });
        
        if (this.txtDrones) {
            this.txtDrones.setText(`DRONES: ${aliveDrones}/${totalDrones}`);
            
            // Colores basados en disponibilidad de drones
            if (aliveDrones === 0) {
                this.txtDrones.setColor('#ff3333'); // Rojo - no hay drones
            } else if (aliveDrones <= totalDrones / 2) {
                this.txtDrones.setColor('#ffaa00'); // Naranja - pocos drones
            } else {
                this.txtDrones.setColor('#ffffff'); // Blanco - bien
            }
        }
    }

    /**
     * Cicla al primer dron activo desde el portadrones, o retorna false si no hay ninguno
     */
    ciclarAlPrimerDron() {
        this.actualizarListaDronesActivos();
        
        console.log(`Ciclo: Intentando ciclar al primer dron. Disponibles: ${this.dronesActivosOrdenados.length}`);
        
        if (this.dronesActivosOrdenados.length === 0) {
            console.log('Ciclo: Sin drones activos disponibles');
            return false;
        }
        
        const primerDron = this.dronesActivosOrdenados[0];
        console.log(`Ciclo: Seleccionando primer dron: ${primerDron.id}`);
        this.seleccionarDron(primerDron.sprite);
        this.currentDronIndex = 0;
        return true;
    }

    /**
     * Cicla al último dron activo (el más recientemente desplegado)
     */
    ciclarAlUltimoDron() {
        this.actualizarListaDronesActivos();
        
        console.log(`Ciclo: Intentando ciclar al ultimo (mas reciente) dron. Disponibles: ${this.dronesActivosOrdenados.length}`);
        
        if (this.dronesActivosOrdenados.length === 0) {
            console.log('Ciclo: Sin drones activos disponibles');
            return false;
        }
        
        const ultimoDron = this.dronesActivosOrdenados[this.dronesActivosOrdenados.length - 1];
        console.log(`Ciclo: Seleccionando ultimo dron: ${ultimoDron.id}`);
        this.seleccionarDron(ultimoDron.sprite);
        this.currentDronIndex = this.dronesActivosOrdenados.length - 1;
        return true;
    }

    /**
     * Cicla al siguiente dron activo, o retorna false si no hay más
     */
    ciclarAlSiguienteDron() {
        this.actualizarListaDronesActivos();
        
        if (this.dronesActivosOrdenados.length === 0) {
            return false;
        }
        
        // Encontrar índice actual basado en activeDron
        if (this.activeDron) {
            const dronIdActual = this.activeDron.getData('elementId') || this.activeDron.id;
            const indiceActual = this.dronesActivosOrdenados.findIndex(d => String(d.id) === String(dronIdActual));
            
            if (indiceActual >= 0) {
                this.currentDronIndex = indiceActual;
            }
        }
        
        // Mover al siguiente
        const siguienteIndice = this.currentDronIndex + 1;
        
        if (siguienteIndice >= this.dronesActivosOrdenados.length) {
            return false; // No hay más drones, volver al portadron
        }
        
        const siguienteDron = this.dronesActivosOrdenados[siguienteIndice];
        this.seleccionarDron(siguienteDron.sprite);
        this.currentDronIndex = siguienteIndice;
        return true;
    }

    /**
     * Muestra animación de caída de dron (cuando batería llega a 0)
     */
    mostrarAnimacionCaidaDron(sprite, tipoDron, clave) {
        if (!sprite) return;
        
        console.log(`Dron cayendo: ${sprite.getData('elementId')}, tipo: ${tipoDron}`);
        
        // Desactivar interactividad
        sprite.disableInteractive();
        
        // Animación de caída: rotación + movimiento hacia abajo + fade out
        let duracionCaida;
        if (tipoDron === 'AEREO') {
            duracionCaida = 2000;
        } else {
            duracionCaida = 1500;
        }
        
        // Efecto de humo/fuego si está disponible
        const efectoCaida = this.add.particles(sprite.x, sprite.y, 'proyectil_bomba', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 800,
            quantity: 2,
            frequency: 50
        });
        
        // Animación de caída
        let angleChange;
        if (tipoDron === 'AEREO') {
            angleChange = '+=720'; // Más rotación para aéreos
        } else {
            angleChange = '+=360';
        }
        let yChange;
        if (tipoDron === 'AEREO') {
            yChange = sprite.y + 300;
        } else {
            yChange = sprite.y + 100;
        }
        this.tweens.add({
            targets: sprite,
            angle: angleChange,
            y: yChange,
            alpha: 0,
            scale: sprite.scale * 0.5,
            duration: duracionCaida,
            ease: 'Quad.easeIn',
            onComplete: () => {
                sprite.destroy();
                efectoCaida.destroy();
                if (clave) {
                    this.dronesAnimandoCaida.delete(clave);
                }
                this.mostrarMensajeTemporal('Dron destruido por falta de batería', 2000, '#ff6666');
                
                // Si era el dron activo, volver al portadron
                const dronId = sprite.getData('elementId');
                const activeDronId = this.activeDron?.getData('elementId');
                
                console.log(`Muerte: Dron ${dronId} destruido. Dron activo: ${activeDronId}, controlMode: ${this.controlMode}`);
                
                if (this.controlMode === 'DRON' && (this.activeDron === sprite || dronId === activeDronId)) {
                    console.log('Muerte: Dron activo murio, regresando al porter');
                    this.volverAlPortadron();
                }
                
                // Actualizar lista de drones activos
                this.actualizarListaDronesActivos();
                
                // Si no hay más drones activos y todavía estamos en modo DRON, forzar regreso al portadrones
                if (this.controlMode === 'DRON' && this.dronesActivosOrdenados.length === 0) {
                    console.log('Muerte: Sin mas drones activos, forzando regreso al porter');
                    this.volverAlPortadron();
                }
            }
        });
    }


     // Muestra animación de destrucción de portadrones (caída + explosiones)

    mostrarAnimacionDestruccionPorter(sprite, tipoPorter, clave) {
        if (!sprite) return;
        
        console.log(`Destruccion: Porter destruido: ${sprite.getData('elementId')}, tipo: ${tipoPorter}`);
        
        // Desactivar interactividad
        sprite.disableInteractive();
        
        // Create full-screen VERY VISIBLE dramatic effect overlay
        const overlay = this.add.graphics();
        overlay.setScrollFactor(0);
        overlay.setDepth(15000);
        overlay.fillStyle(0x000000, 0.9); // Comenzar con 90% de opacidad para maxima visibilidad
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);
        
        // Agregar texto de advertencia grande y parpadeante en el centro de la pantalla
        const warningText = this.add.text(
            this.scale.width / 2,
            100,
            'PORTADRON DESTRUIDO',
            {
                fontSize: '48px',
                fontStyle: 'bold',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 8,
                backgroundColor: '#00000099',
                padding: { x: 20, y: 10 }
            }
        );
        warningText.setOrigin(0.5, 0.5);
        warningText.setScrollFactor(0);
        warningText.setDepth(15002);
        
        // Hacer que el texto de advertencia pulse
        this.tweens.add({
            targets: warningText,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 5
        });
        
        // Crear escena de destrucción en vista lateral (centrada en la pantalla)
        const destructionContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        destructionContainer.setScrollFactor(0);
        destructionContainer.setDepth(15001);
        destructionContainer.setScale(4.0); // Hacer más grande para mayor impacto visual
        
        // Crear silueta en vista lateral del portadrones
        let porterColor;
        if (tipoPorter === 'AEREO') {
            porterColor = 0x88aaff;
        } else {
            porterColor = 0x4477aa;
        }
        const porterSilhouette = this.add.rectangle(0, 0, 110, 52, porterColor);
        porterSilhouette.setAngle(-90); // Vista lateral
        destructionContainer.add(porterSilhouette);
        
        // Crear múltiples sprites de explosión alrededor del portadrones
        for (let i = 0; i < 5; i++) {
            const explosion = this.add.sprite(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 40,
                'fire00'
            );
            explosion.setTint(0xff6600);
            explosion.setScale(1.5);
            destructionContainer.add(explosion);
            
            // Animar explosión a través de los fotogramas de fuego
            let frame = 0;
            const animInterval = setInterval(() => {
                if (frame < 20 && explosion.active) {
                    explosion.setTexture('fire' + String(frame).padStart(2, '0'));
                    frame++;
                } else {
                    clearInterval(animInterval);
                }
            }, 50);
        }
        
        const duracionDestruccion = 3000;
        
        if (tipoPorter === 'AEREO') {
            // AEREO: Animación de caída desde el cielo con giro
            this.tweens.add({
                targets: porterSilhouette,
                angle: '+=720', // Giro mientras cae
                y: 300,
                alpha: 0,
                duration: duracionDestruccion,
                ease: 'Cubic.easeIn'
            });
            
            // Añadir rastro de humo mientras cae
            const smoke = this.add.particles(0, -50, 'proyectil_bomba', {
                speed: { min: 20, max: 50 },
                scale: { start: 0.8, end: 0.2 },
                alpha: { start: 0.6, end: 0 },
                tint: 0x666666,
                lifespan: 800,
                frequency: 50,
                follow: porterSilhouette
            });
            destructionContainer.add(smoke);
            
        } else {
            // NAVAL: Animación de hundimiento en el agua con inclinación
            this.tweens.add({
                targets: porterSilhouette,
                angle: '+=90', // Inclinación hacia un lado
                y: 200,
                scaleY: 0.3, // Comprimir mientras se hunde
                alpha: 0,
                duration: duracionDestruccion,
                ease: 'Sine.easeIn'
            });
            
            // Añadir partículas de salpicadura de agua
            const splash = this.add.particles(0, 100, 'proyectil_bomba', {
                speed: { min: 100, max: 200 },
                scale: { start: 1.0, end: 0.3 },
                alpha: { start: 0.8, end: 0 },
                tint: 0x4488ff,
                lifespan: 1000,
                quantity: 20,
                frequency: -1
            });
            destructionContainer.add(splash);
            splash.explode();
        }
        
        // Chequear si el portadrones destruido es el propio para mostrar mensaje específico
        const porterId = sprite.getData('elementId');
        const ownPorter = this.obtenerEstadoPortadronPropio();
        const isOwnPorter = ownPorter && porterId === ownPorter.id;
        
        // Limpiar después de la animación
        setTimeout(() => {
            sprite.destroy();
            destructionContainer.destroy();
            overlay.destroy();
            warningText.destroy();
            if (clave) {
                this.portersAnimandoDestruccion.delete(clave);
            }
            
            const mensaje = tipoPorter === 'AEREO' 
                ? '¡Portadrones aéreo destruido!' 
                : '¡Portadrones naval hundido!';
            this.mostrarMensajeTemporal(mensaje, 2500, '#ff4444');
            
            // Verificar condición de fin de juego
            if (!this.gameOverTriggered) {
                this.checkGameOverCondition();
            }
        }, duracionDestruccion);
    }

    /**
     * Verifica y procesa drones que se quedaron sin batería
     */
    verificarDronesSinBateria() {
        this.elementosSprites.forEach((sprite, clave) => {
            const elemento = this.elementosEstado.get(clave);
            if (!elemento) {
                return;
            }
            
            // Manejar drones destruidos
            if (elemento.clase === 'DRON' && elemento.estado === 'DESTRUIDO') {
                if (!sprite.active || !sprite.visible) {
                    // Ya destruido o oculto, omitir
                    return;
                }
                
                if (this.dronesAnimandoCaida.has(clave)) {
                    // Animación ya en progreso
                    return;
                }
                
                console.log(`Muerte: Detectado dron destruido: ${clave} (ID: ${elemento.id}), iniciando animacion de caida`);
                this.dronesAnimandoCaida.add(clave);
                let tipoDron;
                if (elemento.tipoEquipo) {
                    tipoDron = elemento.tipoEquipo;
                } else {
                    tipoDron = 'NAVAL';
                }
                this.mostrarAnimacionCaidaDron(sprite, tipoDron, clave);
            }
            
            // Manejar portadrones destruidos - VERIFICAR VIDA PRIMERO
            if (elemento.clase === 'PORTADRON' && elemento.estado === 'DESTRUIDO') {
                if (!sprite.active || !sprite.visible) {
                    // Ya destruido u oculto
                    return;
                }
                
                if (this.portersAnimandoDestruccion.has(clave)) {
                    // Animación ya en progreso
                    return;
                }
                
                // Chequear vida antes de destrucción
                const vida = Number(elemento.vida) || 0;
                let tipoPorter;
                if (elemento.tipoEquipo) {
                    tipoPorter = elemento.tipoEquipo;
                } else {
                    tipoPorter = 'NAVAL';
                }
                let vidaMax;
                if (tipoPorter === 'AEREO') {
                    vidaMax = 1000; // Usar valor correcto (va a depender del backend)
                } else {
                    vidaMax = 800; // Usar valor correcto (va a depender del backend)
                }
                
                console.error(`%cDestruccion: PORTER ${elemento.id} MARCADO DESTRUIDO POR EL BACKEND`, 'color: #ff0000; font-size: 14px; font-weight: bold', {
                    porterId: elemento.id,
                    vidaFrontendScaled: vida,
                    vidaMax: vidaMax,
                    vidaPercentage: ((vida / vidaMax) * 100).toFixed(1) + '%',
                    estado: elemento.estado,
                    tipoPorter: tipoPorter,
                    shouldDestroy: vida <= 0,
                    stackTrace: new Error().stack,
                    pendingRecharge: this.pendingRechargeRequest ? `SI - Dron ${this.pendingRechargeRequest.dronId}` : 'NO'
                });
                
                // Solo animar destruccion si vida realmente llego a 0 o menos, para evitar bugs de backend que marquen DESTRUIDO prematuramente
                if (vida <= 0) {
                    console.error(`%cDestruccion: PORTER ${elemento.id} DESTRUCCION CONFIRMADA (vida=${vida})`, 'color: #ff0000; font-size: 12px; font-weight: bold');
                    console.log(`Destruccion: Iniciando animacion de destruccion para porter ${clave}`);
                    this.portersAnimandoDestruccion.add(clave);
                    this.mostrarAnimacionDestruccionPorter(sprite, tipoPorter, clave);
                } else {
                    console.error(`%cDestruccion: BUG DEL BACKEND: Porter ${elemento.id} marcado DESTRUIDO pero vida=${vida} (${((vida/vidaMax)*100).toFixed(1)}%). Omitiendo animacion`, 'color: #ff6600; font-size: 12px; font-weight: bold');
                    console.error(`Destruccion: Esto significa que el rastreo de salud del backend esta mal o salud maxima backend != salud maxima frontend`);
                }
            }
        });
    }

    /**
     * Verifica si el juego ha terminado - AMBOS portadrones Y todos los drones de un equipo destruidos
     * Un jugador gana SOLO cuando el portadrones enemigo Y todos los drones enemigos están destruidos
     */
    checkGameOverCondition() {
        if (this.gameOverTriggered) {
            return;
        }
        
        // Contar unidades propias
        let ownPorterAlive = false;
        let ownAliveDrones = 0;
        let ownDestroyedDrones = 0;
        let ownTotalDrones = 0;
        
        // Contar unidades enemigas
        let enemyPorterAlive = false;
        let enemyAliveDrones = 0;
        let enemyDestroyedDrones = 0;
        let enemyTotalDrones = 0;
        
        this.elementosEstado.forEach((elemento) => {
            const isOwn = this.esElementoPropio(elemento);
            
            if (elemento.clase === 'PORTADRON') {
                if (elemento.estado !== 'DESTRUIDO') {
                    if (isOwn) {
                        ownPorterAlive = true;
                    } else {
                        enemyPorterAlive = true;
                    }
                }
            } else if (elemento.clase === 'DRON') {
                if (isOwn) {
                    ownTotalDrones++;
                    // Un dron está vivo, solo si batería > 0
                    // Un dron está muerto si DESTRUIDO O (INACTIVO con batería <= 0)
                    if (elemento.estado === 'ACTIVO' && (elemento.bateria === undefined || elemento.bateria > 0)) {
                        ownAliveDrones++;
                    } else {
                        // Contar como destruido: estado DESTRUIDO O muerto por batería
                        ownDestroyedDrones++;
                    }
                } else {
                    enemyTotalDrones++;
                    // Un dron está vivo, solo si batería > 0
                    // Un dron está muerto si DESTRUIDO O (INACTIVO con batería <= 0)
                    if (elemento.estado === 'ACTIVO' && (elemento.bateria === undefined || elemento.bateria > 0)) {
                        enemyAliveDrones++;
                    } else {
                        // Contar como destruido: estado DESTRUIDO O muerto por batería
                        enemyDestroyedDrones++;
                    }
                }
            }
        });
        
        console.log('FinDeJuego: Verificacion:', {
            ownPorterAlive,
            ownAliveDrones,
            ownDestroyedDrones,
            ownTotalDrones,
            enemyPorterAlive,
            enemyAliveDrones,
            enemyDestroyedDrones,
            enemyTotalDrones
        });
        
        // Un equipo es derrotado SOLO cuando se cumplen AMBAS condiciones:
        // 1. El portador está destruido
        // 2. TODOS los drones están muertos (DESTRUIDO o sin batería)
        const ownDefeated = !ownPorterAlive && ownDestroyedDrones === ownTotalDrones && ownTotalDrones > 0;
        const enemyDefeated = !enemyPorterAlive && enemyDestroyedDrones === enemyTotalDrones && enemyTotalDrones > 0;
        
        console.log('FinDeJuego: Verificacion de derrota:', {
            ownDefeated: ownDefeated,
            ownConditions: {
                porterDead: !ownPorterAlive,
                allDronesDead: ownDestroyedDrones === ownTotalDrones,
                hasAnyDrones: ownTotalDrones > 0
            },
            enemyDefeated: enemyDefeated,
            enemyConditions: {
                porterDead: !enemyPorterAlive,
                allDronesDead: enemyDestroyedDrones === enemyTotalDrones,
                hasAnyDrones: enemyTotalDrones > 0
            }
        });
        
        // Verificar condiciones de fin de juego
        if (ownDefeated && enemyDefeated) {
            // Ambos equipos destruidos simultáneamente - EMPATE
            this.gameOverTriggered = true;
            console.log('FinDeJuego: Destruccion mutua - EMPATE');
            setTimeout(() => {
                this.transitionToGameOver('tie');
            }, 2000);
        } else if (ownDefeated) {
            // Perdimos
            this.gameOverTriggered = true;
            console.log('FinDeJuego: Equipo propio derrotado - DERROTA');
            setTimeout(() => {
                this.transitionToGameOver('loss');
            }, 2000);
        } else if (enemyDefeated) {
            // Ganamos
            this.gameOverTriggered = true;
            console.log('FinDeJuego: Equipo enemigo derrotado - VICTORIA');
            setTimeout(() => {
                this.transitionToGameOver('win');
            }, 2000);
        }
    }

    transitionToGameOver(result) {
        console.log('FinDeJuego: Transicionando a la escena GameOver, resultado:', result);
        
        // Limpiar
        if (this.socket) {
            // No cerrar el socket, solo dejar de escuchar
            this.socket.onmessage = null;
        }
        
        // Detener esta escena y comenzar la escena GameOver
        // resultado puede ser: 'win', 'loss', 'tie', o 'opponent_left'
        this.scene.start('GameOver', { result: result });
    }

    emitirDisparo(pointer) {
        let activeDronStatus;
        if (this.activeDron) {
            activeDronStatus = 'exists';
        } else {
            activeDronStatus = 'null';
        }
        console.log('Disparo: emitirDisparo llamado', {
            controlMode: this.controlMode,
            activeDron: activeDronStatus,
            activeDronActive: this.activeDron?.active,
            activeDronId: this.activeDron?.getData?.('elementId') || this.activeDron?.id
        });

        // Verificaciones de seguridad para el dron activo
        if (!this.activeDron || !this.activeDron.active) {
            console.log('Disparo: No hay un dron activo valido desde el cual disparar');
            return;
        }
        
        const dronId = this.activeDron?.getData('elementId') || this.activeDron?.id;
        if (!dronId) {
            console.log('Disparo: El dron activo no tiene ID');
            return;
        }
        
        // Verificar si el dron está destruido en el estado del backend
        const clave = this.buscarClaveBackendExistentePorId(dronId);
        let dronEstado;
        if (clave) {
            dronEstado = this.elementosBackendEstado.get(clave);
        } else {
            dronEstado = null;
        }
        
        console.log('Disparo: Verificacion del estado del dron:', {
            dronId,
            clave,
            estado: dronEstado?.estado,
            vida: dronEstado?.vida,
            bateria: dronEstado?.bateria,
            municion: dronEstado?.municionDisponible
        });
        
        if (dronEstado && dronEstado.estado === 'DESTRUIDO') {
            console.log('Disparo: No se puede disparar desde un dron destruido');
            this.volverAlPortadron();
            return;
        }

        if (this.pendingShotRequest) {
            console.log('Disparo: Disparo ya pendiente, ignorando...');
            return;
        }

        console.log(`Disparo: Intentando disparar desde el dron ${dronId}`);

        this.pendingShotRequest = {
            dronId: Number(dronId),
            clickX: Number(pointer?.worldX ?? this.activeDron?.x ?? 0),
            clickY: Number(pointer?.worldY ?? this.activeDron?.y ?? 0)
        };

        const enviado = this.enviarAlSocket({
            tipo: "DISPARAR",
            IdDron: Number(dronId)
        });

        if (!enviado) {
            console.log('Disparo: No se pudo enviar la solicitud de disparo');
            this.pendingShotRequest = null;
        } else {
            console.log('Disparo: Solicitud de disparo enviada con exito');
        }
    }

    confirmarDisparoPendiente() {
        if (!this.pendingShotRequest) {
            return;
        }
        this.pendingShotRequest = null;
    }

    rechazarDisparoPendiente(msg) {
        if (msg) {
            console.warn('Juego: Disparo fallido', msg.mensaje || msg.Mensaje || msg);
        }
        this.pendingShotRequest = null;
    }

    actualizarHUDDesdeDronActivo() {
        const dron = this.obtenerEstadoDronActivo();
        if (!dron || dron.clase !== 'DRON') {
            return;
        }

        // Calcular tiempo restante en segundos (60 segundos totales para batería)
        const bateriaPorcentaje = Number(dron.bateria) || 0;
        const segundosRestantes = Math.floor((bateriaPorcentaje / 100) * 60);
        const bateriaTexto = `${this.formatearPorcentaje(dron.bateria)} (${segundosRestantes}s)`;

        // Pasar valor numérico de vida para que el HUD pueda manejar casos de vida > 100 o vida desconocida
        this.actualizarHUD({
            vida: Number(dron.vida) || 0,
            vidaMax: 100, // Los drones siempre tienen 100 HP maximo
            bateria: bateriaTexto,
            municion: this.formatearCantidad(dron.municionDisponible)
        });

        // Cambiar color de batería según nivel
        if (this.txtBateria) {
            if (bateriaPorcentaje <= 20) {
                this.txtBateria.setColor('#ff3333'); // Rojo crítico
            } else if (bateriaPorcentaje <= 40) {
                this.txtBateria.setColor('#ffaa00'); // Naranja advertencia
            } else {
                this.txtBateria.setColor('#ffffff'); // Blanco normal
            }
        }
    }

    actualizarHUDDesdePortadronActivo(spritePortadron) {
        const portaId = spritePortadron?.getData?.('elementId') || spritePortadron?.id || this.ownPortadronId;
        if (portaId === undefined || portaId === null) {
            console.warn('HUD: ID de Portadron no encontrado');
            return;
        }

        const clave = this.buscarClaveBackendExistentePorId(portaId);
        if (!clave) {
            console.warn('HUD: No se encontro clave backend para porterId:', portaId);
            return;
        }

        const porta = this.elementosBackendEstado.get(clave);
        if (!porta || porta.clase !== 'PORTADRON') {
            console.warn('HUD: Portadron no encontrado en el estado del backend o clase incorrecta:', porta);
            return;
        }

        // Determinar la salud máxima basado en el tipo de portador
        const tipoPorter = String(porta.tipoEquipo || this.playerTeam || 'NAVAL').toUpperCase();
        let vidaMax;
        if (tipoPorter === 'AEREO') {
            vidaMax = 1000; // Esto lo determinda backend luego!!
        } else {
            vidaMax = 800; // Esto lo determinda backend luego!!
        }

        const vidaValue = Number(porta.vida);
        console.log('HUD: Actualizacion de salud del portador:', {
            portaId,
            clave,
            vidaRaw: porta.vida,
            vidaParsed: vidaValue,
            vidaMax,
            tipoPorter,
            estado: porta.estado
        });

        // Si vida es explícitamente 0 o un número válido, úsalo; si es undefined/null/NaN, verifica elementosEstado o usa vidaMax
        let vidaFinal;
        if (Number.isFinite(vidaValue)) {
            vidaFinal = vidaValue;
        } else {
            // Intenta obtenerlo de elementosEstado como respaldo
            const estadoElemento = this.elementosEstado.get(clave);
            if (estadoElemento && Number.isFinite(Number(estadoElemento.vida))) {
                vidaFinal = Number(estadoElemento.vida);
                console.log('HUD: Usando vida de elementosEstado:', vidaFinal);
            } else {
                // Usar vida completa si no se encuentra
                vidaFinal = vidaMax;
                console.warn('HUD: Vida no encontrada, usando vidaMax por defecto');
            }
        }
        
        this.actualizarHUD({
            vida: vidaFinal,
            vidaMax: vidaMax,
            bateria: 'N/A',
            municion: 'N/A'
        });
    }

    obtenerPortadronPropioClickeado(gameObjects) {
        if (!Array.isArray(gameObjects) || gameObjects.length === 0) {
            return null;
        }

        for (let i = 0; i < gameObjects.length; i++) {
            const obj = gameObjects[i];
            if (!obj || !obj.getData) {
                continue;
            }

            const clase = obj.getData('elementClass');
            const elementId = obj.getData('elementId') || obj.id;

            if (clase === 'PORTADRON' && elementId !== undefined && elementId !== null) {
                if (this.ownPortadronId !== null && this.ownPortadronId !== undefined && String(elementId) === String(this.ownPortadronId)) {
                    return { id: elementId };
                }
            }
        }

        return null;
    }

    encontrarDronesActivosCercanos(porterElemento) {
        const dronesNearby = [];
        const porterX = Number(porterElemento.x);
        const porterY = Number(porterElemento.y);
        const rechargeRadius = 200; // Mismo que cheque de distancia para recarga en solicitarRecargaDron
        
        this.elementosEstado.forEach((elemento) => {
            // Debe ser un dron propio
            if (!this.esElementoPropio(elemento)) {
                return;
            }
            
            // Debe ser un dron
            if (elemento.clase !== 'DRON') {
                return;
            }
            
            // Debe estar volando activamente (estado ACTIVO y z > 0)
            if (elemento.estado !== 'ACTIVO') {
                return;
            }
            
            const droneZ = Number(elemento.z);
            if (!Number.isFinite(droneZ) || droneZ <= 0) {
                return; // Omitir drones dentro del portador (z <= 0)
            }
            
            // Verificar distancia
            const dx = Number(elemento.x) - porterX;
            const dy = Number(elemento.y) - porterY;
            const distancia = Math.sqrt((dx * dx) + (dy * dy));
            
            if (Number.isFinite(distancia) && distancia <= rechargeRadius) {
                dronesNearby.push({
                    id: elemento.id,
                    distancia: distancia,
                    bateria: elemento.bateria
                });
            }
        });
        
        return dronesNearby;
    }

    solicitarRecargarDronesDesdePorter(portadronId, drones) {
        console.log(`Recarga: Modo porter: recargando ${drones.length} dron(es) cerca del porter ${portadronId}`);
        
        // Mandar recarga individual para cada dron cercano
        drones.forEach(droneInfo => {
            console.log(`Recarga: Enviando recarga para dron ${droneInfo.id} (distancia: ${droneInfo.distancia.toFixed(1)}px, bateria: ${droneInfo.bateria}%)`);
            
            this.enviarAlSocket({
                tipo: 'RECARGAR',
                IdDron: Number(droneInfo.id),
                IdPortadron: Number(portadronId)
            });
        });
        
        const droneIds = drones.map(d => d.id).join(', ');
        this.mostrarMensajeTemporal(`Recargando dron(es): ${droneIds}`, 1800, '#d6e8ff');
    }

    solicitarRecargaDron(portadronId) {
        console.log(`Recarga: ========== SOLICITUD DE RECARGA INICIADA ==========`);
        console.log(`Recarga: Porter ID: ${portadronId}, controlMode: ${this.controlMode}`);
        
        if (this.pendingRechargeRequest) {
            console.log('Recarga: BLOQUEADO: Solicitud ya pendiente');
            return;
        }

        const dron = this.obtenerEstadoDronActivo();
        const porta = this.obtenerEstadoPortadronPropio();
        
        let dronInfo;
        if (dron) {
            dronInfo = { id: dron.id, estado: dron.estado, x: dron.x, y: dron.y, bateria: dron.bateria };
        } else {
            dronInfo = null;
        }
        let portaInfo;
        if (porta) {
            portaInfo = { id: porta.id, estado: porta.estado, x: porta.x, y: porta.y };
        } else {
            portaInfo = null;
        }
        let activeDronStatus;
        if (this.activeDron) {
            activeDronStatus = 'exists';
        } else {
            activeDronStatus = 'NULL';
        }
        console.log('Recarga: Obtenido estados:', {
            dron: dronInfo,
            porta: portaInfo,
            activeDron: activeDronStatus
        });
        
        if (!dron || !porta) {
            console.log('Recarga: RECHAZADO: dron o porta no encontrado');
            this.mostrarMensajeTemporal('No se pudo validar recarga', 1500, '#ffd6d6');
            return;
        }

        if (!this.esEstadoActivo(dron.estado) || !this.esEstadoActivo(porta.estado)) {
            console.log('Recarga: RECHAZADO: estado invalido', {dronEstado: dron.estado, portaEstado: porta.estado});
            this.mostrarMensajeTemporal('No se puede recargar en este estado', 1500, '#ffd6d6');
            return;
        }

        const dx = Number(dron.x) - Number(porta.x);
        const dy = Number(dron.y) - Number(porta.y);
        const distancia = Math.sqrt((dx * dx) + (dy * dy));
        console.log(`Recarga: Distancia: ${distancia.toFixed(2)}px (limite: 220px)`);
        
        // Aumentado a 220px para un juego más indulgente - el sprite del porter es 180x80, esto asegura que "cerca del porter" funcione
        if (!Number.isFinite(distancia) || distancia > 220) {
            console.log(`Recarga: RECHAZADO: distancia demasiado lejana (${distancia.toFixed(2)} > 220)`);
            this.mostrarMensajeTemporal('Acercá el dron al portadron para recargar', 1600, '#ffe8b0');
            return;
        }

        const dronId = this.activeDron?.getData('elementId') || this.activeDron?.id;
        if (dronId === undefined || dronId === null) {
            console.log('Recarga: RECHAZADO: dronId es null/undefined');
            return;
        }

        console.log(`Recarga: VALIDACION PASADA: Enviando solicitud de recarga para dron ${dronId} desde portadron ${portadronId}`);
        console.log(`Recarga: Detalles de solicitud: { tipo: SOLICITANDO_RECARGAR, IdDron: ${dronId}, IdPortadron: ${portadronId} }`);
        
        // REGISTRAR SALUD DEL PORTER ANTES DE LA SOLICITUD DE RECARGA
        console.log(`%cRecarga: SALUD DEL PORTER ANTES DE LA SOLICITUD DE RECARGA:`, 'color: #ff9900; font-weight: bold', {
            porterId: portadronId,
            vidaFrontend: porta.vida,
            vidaBackend: 'ver logs de PORTER VIDA',
            estado: porta.estado,
            warning: 'Si el porter muere despues de esto, comparar salud del backend'
        });
        
        const enviado = this.enviarAlSocket({
            tipo: 'SOLICITANDO_RECARGAR',  // Backend diferencia entre solicitud de jugador ('SOLICITANDO_RECARGAR') y comando directo ('RECARGAR'). Responde con RECARGADO_EXITOSO o RECARGADO_FALLIDO
            IdDron: Number(dronId),
            IdPortadron: Number(portadronId)
        });

        if (enviado) {
            console.log(`Recarga: Solicitud enviada exitosamente, esperando respuesta del backend...`);
            this.pendingRechargeRequest = {
                dronId: Number(dronId),
                portadronId: Number(portadronId)
            };
        } else {
            console.error(`Recarga: Fallo al enviar solicitud - socket no conectado?`);
        }
    }

    confirmarRecargaPendiente(msg) {
        console.log(`%cRecarga: RECARGADO_EXITOSO confirmado a las ${new Date().toLocaleTimeString()}`, 'color: #00ff00; font-size: 14px; font-weight: bold');
        console.log('Recarga: Backend confirmo - restaurando dron: bateria=100, salud=100, municion=12');
        
        // Registrar salud del porter DESPUES de recarga exitosa
        const porta = this.obtenerEstadoPortadronPropio();
        if (porta) {
            console.log(`%cRecarga: Salud del porter DESPUES de recarga exitosa:`, 'color: #00ff00; font-weight: bold', {
                porterId: porta.id,
                vida: porta.vida,
                estado: porta.estado,
                timestamp: new Date().toLocaleTimeString()
            });
        }
        
        this.pendingRechargeRequest = null;
        
        // Resetear el temporizador de drenaje de batería para evitar caída inmediata después de recargar
        this.lastBatteryDrainTime = Date.now();
        
        // Actualizar el estado del dron activo a batería 100%, vida 100%, munición 12
        if (this.activeDron) {
            const dronId = this.activeDron.getData('elementId') || this.activeDron.id;
            if (dronId) {
                // Actualizar en elementosEstado
                const clave = this.buscarClaveExistentePorId(dronId);
                if (clave) {
                    const elemento = this.elementosEstado.get(clave);
                    if (elemento) {
                        elemento.bateria = 100;
                        elemento.vida = 100;  // También restaurar la salud
                        elemento.municionDisponible = 12;
                        console.log(`Recarga: Actualizado dron ${dronId} - bateria: 100%, salud: 100%, municion: 12`);
                    }
                }
                
                // Actualizar en elementosBackendEstado
                const claveBackend = this.buscarClaveBackendExistentePorId(dronId);
                if (claveBackend) {
                    const backendElemento = this.elementosBackendEstado.get(claveBackend);
                    if (backendElemento) {
                        backendElemento.bateria = 100;
                        backendElemento.vida = 100;  // También restaurar la salud
                        backendElemento.municionDisponible = 12;
                    }
                }
            }
        }
        
        this.mostrarMensajeTemporal('Bateria, salud y municion recargadas', 2000, '#d6ffd6');

        if (this.controlMode === 'DRON') {
            this.actualizarHUDDesdeDronActivo();
        }
        
        // Forzar barra de vida a actualizarse inmediatamente para reflejar la recarga (en caso de que el dron estuviera en rojo por baja salud)
        this.renderizarElementos();
    }

    rechazarRecargaPendiente(msg) {
        console.error('Recarga: Recarga rechazada por backend:', msg);
        this.pendingRechargeRequest = null;
        const detalle = msg?.mensaje || msg?.Mensaje || 'No se pudo recargar';
        this.mostrarMensajeTemporal(detalle, 1800, '#ffd6d6');
    }

    mostrarMensajeTemporal(texto, duracionMs = 1600, color = '#ffffff') {
        if (!this.toastText) {
            this.toastText = this.add.text(this.scale.width / 2, this.scale.height - 130, '', {
                fontSize: '22px',
                fontStyle: 'bold',
                fill: color,
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5).setScrollFactor(0).setDepth(9600);
        }

        this.toastText.setText(texto);
        this.toastText.setColor(color);
        this.toastText.setPosition(this.scale.width / 2, this.scale.height - 130);
        this.toastText.setAlpha(1);
        this.toastText.setVisible(true);

        this.tweens.killTweensOf(this.toastText);
        this.tweens.add({
            targets: this.toastText,
            alpha: 0,
            delay: Math.max(200, duracionMs - 250),
            duration: 250,
            ease: 'Sine.easeOut'
        });
    }

    formatearPorcentaje(valor) {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) {
            return '0%';
        }
        return `${Math.max(0, Math.floor(numero))}%`;
    }

    formatearCantidad(valor) {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) {
            return '0';
        }
        return `${Math.max(0, Math.floor(numero))}`;
    }

    formatearVidaPorcentaje(vida, estado) {
        const estadoNormalizado = String(estado || '').toUpperCase();
        if (estadoNormalizado && estadoNormalizado !== 'ACTIVO' && estadoNormalizado !== 'ACTIVE') {
            return '0%';
        }

        const numeroVida = Number(vida);
        if (!Number.isFinite(numeroVida)) {
            return '100%';
        }

        return `${Math.max(0, Math.floor(numeroVida))}%`;
    }

    enviarMovimiento(elemento) {
        if (!elemento) {
            return;
        }

        let elementId;
        if (elemento.getData) {
            elementId = elemento.getData('elementId');
        } else {
            elementId = elemento.id;
        }
        if (elementId === undefined || elementId === null) {
            return;
        }

        let z = 0;
        let zDato;
        if (elemento.getData) {
            zDato = elemento.getData('elementZ');
        } else {
            zDato = undefined;
        }
        if (zDato !== undefined && zDato !== null && Number.isFinite(Number(zDato))) {
            z = Number(zDato);
        }

        this.enviarAlSocket({
            tipo: "MOVER_ELEMENTO",
            idElemento: Number(elementId),
            PosicionX: Number(elemento.x),
            PosicionY: Number(elemento.y),
            PosicionZ: z,
            Angulo: Math.floor(elemento.angle || 0)
        });
    }

    enviarAlSocket(json) {
        if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
            window.gameSocket.send(JSON.stringify(json));
            return true;
        }
        return false;
    }

    crearInterfazHUD() {
        const estiloPrincipal = {
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        };
        const estiloSecundario = {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        this.txtEquipo = this.add.text(20, 95, `EQUIPO ${this.playerTeam}`, estiloPrincipal).setScrollFactor(0).setDepth(9500);
        this.txtModo = this.add.text(20, 127, `CONTROL ${this.controlMode}`, estiloPrincipal).setScrollFactor(0).setDepth(9500);
        this.txtDrones = this.add.text(20, 159, 'DRONES: 0/0', estiloPrincipal).setScrollFactor(0).setDepth(9500);
        this.txtVida = this.add.text(20, this.scale.height - 92, 'VIDA: ---', estiloSecundario).setScrollFactor(0).setDepth(9500);
        this.txtBateria = this.add.text(20, this.scale.height - 62, 'BATERÍA: ---', estiloSecundario).setScrollFactor(0).setDepth(9500);
        this.txtMunicion = this.add.text(20, this.scale.height - 32, 'MUNICIÓN: ---', estiloSecundario).setScrollFactor(0).setDepth(9500);
        
        // Texto de indicación de recarga - solo visible cuando se controla un dron y está en rango
        this.txtRechargeHint = this.add.text(
            this.scale.width / 2, 
            this.scale.height - 180, 
            '🔋 ZONA DE RECARGA - Presiona [R] o haz clic aquí', 
            {
                font: 'bold 20px Arial',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: '#00000099',
                padding: { x: 10, y: 5 }
            }
        ).setScrollFactor(0).setDepth(9700).setOrigin(0.5, 0); // Alineado al centro horizontalmente, y justo encima del HUD principal
        this.txtRechargeHint.setShadow(0, 0, '#00ff0099', 16, true, true);
        this.txtRechargeHint.setVisible(false);
        
        this.txtEquipo.setShadow(0, 0, '#e1f1f19a', 16, true, true);
        this.txtModo.setShadow(0, 0, '#e1f1f19a', 16, true, true);
        this.txtDrones.setShadow(0, 0, '#e1f1f19a', 16, true, true);
        this.txtVida.setShadow(0, 0, '#e1f1f19a', 12, true, true);
        this.txtBateria.setShadow(0, 0, '#e1f1f19a', 12, true, true);
        this.txtMunicion.setShadow(0, 0, '#e1f1f19a', 12, true, true);
    }

    actualizarHUD(datosUnidad) {
        if (!datosUnidad) return;
        
        // Calcular el porcentaje de vida a partir de los valores enviados por el backend
        const vidaActual = Number(datosUnidad.vida) || 0;
        const vidaMax = Number(datosUnidad.vidaMax) || 100;
        const vidaPorcentaje = Math.round((vidaActual / vidaMax) * 100);
        
        // Mostrar tanto el valor absoluto como el porcentaje
        if (this.txtVida) {
            this.txtVida.setText(`VIDA: ${vidaActual}/${vidaMax} (${vidaPorcentaje}%)`);
            
            // Codificación de color basada en el porcentaje de vida
            if (vidaPorcentaje <= 20) {
                this.txtVida.setColor('#ff3333'); // Rojo crítico
            } else if (vidaPorcentaje <= 50) {
                this.txtVida.setColor('#ffaa00'); // Naranja de advertencia
            } else {
                this.txtVida.setColor('#ffffff'); // Blanco normal
            }
        }
        
        if (this.txtBateria) this.txtBateria.setText(`BATERÍA: ${datosUnidad.bateria}`);
        if (this.txtMunicion) this.txtMunicion.setText(`MUNICIÓN: ${datosUnidad.municion}`);
        if (this.txtModo) this.txtModo.setText(`CONTROL ${this.controlMode}`);
    }

    shutdown() {
        if (this.toastText) {
            this.toastText.destroy();
            this.toastText = null;
        }

        if (this.minimap) {
            if (this.minimap.fondo) this.minimap.fondo.destroy();
            if (this.minimap.borde) this.minimap.borde.destroy();
            if (this.minimap.puntoPortadron) this.minimap.puntoPortadron.destroy();
            if (this.minimap.etiquetaPortadron) this.minimap.etiquetaPortadron.destroy();
            if (this.minimap.puntoDron) this.minimap.puntoDron.destroy();
            if (this.minimap.etiquetaDron) this.minimap.etiquetaDron.destroy();
            this.minimap = null;
        }

        if (this.portadronDirectionArrow) {
            this.portadronDirectionArrow.destroy();
            this.portadronDirectionArrow = null;
        }

        this.elementosLifebars.forEach((barra) => {
            if (barra.fondo) {
                barra.fondo.destroy();
            }
            if (barra.relleno) {
                barra.relleno.destroy();
            }
        });
        this.elementosLifebars.clear();

        this.elementosBateriabars.forEach((barra) => {
            if (barra.fondo) {
                barra.fondo.destroy();
            }
            if (barra.relleno) {
                barra.relleno.destroy();
            }
        });
        this.elementosBateriabars.clear();

        this.proyectilesSprites.forEach((sprite) => {
            sprite.destroy();
        });
        this.proyectilesSprites.clear();
        this.proyectilesEstado.clear();
    }
}