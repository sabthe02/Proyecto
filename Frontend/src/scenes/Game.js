export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.playerTeam = data.team || 'NAVAL';
        this.playerId = data.playerId || sessionStorage.getItem('playerId') || '';
        this.nickname = data.nickname || 'Player';
        this.jugadoresCount = 0;
        this.ownPortadronId = null;
        this.ownPortadronKey = null;
        this.idPartida = null;
        this.controlMode = 'PORTADRONES';
        this.activeDron = null;
        this.lastSelectedDronId = null;
        this.unidadesRemotas = new Map();
        this.elementosEstado = new Map();
        this.elementosSprites = new Map();
        this.elementosLabels = new Map();
        this.elementosLifebars = new Map();
        this.proyectilesEstado = new Map();
        this.proyectilesSprites = new Map();
        this.partidaInicial = null;
        this.pendingMoveRequest = null;
        this.pendingShotRequest = null;
        this.dronesActivados = new Set();
        this.visionRangeAereo = 250;
        this.visionRangeNaval = 125;
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
    }

    create() {
        console.log("Visualizador de Batalla iniciado");

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

        
        this.configurarUnidadSegunEquipo();

      
        if (this.unit) {
            this.cameras.main.startFollow(this.unit, true, 0.05, 0.05);
        }

        // pintura inicial de la niebla de guerra
        this.dibujarVision();

        
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.controlMode === 'DRON') {
                this.volverAlPortadron();
                return;
            }

            if (this.controlMode === 'PORTADRONES' && this.intentarVolverADronSeleccionado()) {
                return;
            }

            this.solicitarLanzarDron();
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
                            break;
                        case 'MOVIMIENTO_PROCESADO':
                            this.confirmarMovimientoPendiente();
                            break;
                        case 'DISPARO_PROCESADO':
                            this.confirmarDisparoPendiente();
                            break;
                        case 'MOVIMIENTO_FALLIDO':
                            this.rechazarMovimientoPendiente(msg);
                            break;
                        case 'ERROR':
                            this.rechazarMovimientoPendiente(msg);
                            this.rechazarDisparoPendiente(msg);
                            console.warn('[Game] error servidor', msg.mensaje || msg);
                            break;
                        case 'DISPARO_FALLIDO':
                            this.rechazarDisparoPendiente(msg);
                            break;
                        default:
                            break;
                    }
                } catch (e) {
                    console.warn('[Game] error parseando mensaje', e);
                }
            };
        }

        this.input.on('pointerdown', (pointer, gameObjects) => {
            if (this.controlMode !== 'DRON' || !this.activeDron) {
                return;
            }

            const clickedInteractiveElemento =
                Array.isArray(gameObjects) &&
                gameObjects.some((obj) => obj && obj.getData && obj.getData('elementClass'));

            if (clickedInteractiveElemento) {
                return;
            }

            this.emitirDisparo(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            this.moverControlConMouse(pointer);
        });

        this.crearInterfazHUD();
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
        let target = this.unit;
        if (this.controlMode === 'DRON' && this.activeDron) {
            target = this.activeDron;
        }
        if (!target || target.x === undefined || target.x === null) return;

        let moved = false;
        const speed = 2.5;

        
        let nextX = target.x;
        let nextY = target.y;
        let nextAngle = target.angle || 0;

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

      
        if (this.cursors.up.isDown && this.cursors.right.isDown) nextAngle = -45;
        if (this.cursors.up.isDown && this.cursors.left.isDown) nextAngle = -135;
        if (this.cursors.down.isDown && this.cursors.right.isDown) nextAngle = 45;
        if (this.cursors.down.isDown && this.cursors.left.isDown) nextAngle = 135;

        
        // fondo estático uniforme para mantener apariencia consistente

        if (moved) {
            this.solicitarMovimientoObjetivo(target, nextX, nextY, nextAngle);
        }

        this.dibujarVision();
    }

    procesarPartidaIniciada(datosPartida) {
        if (!datosPartida) {
            return;
        }

        this.resolverEquipoJugador(datosPartida);
        console.log('[Game] Identidad local -> playerId:', this.playerId, 'nickname:', this.nickname, 'team:', this.playerTeam);

        const elementos = this.extraerElementosIniciales(datosPartida);
        const cantPortaAereo = elementos.filter((e) => e.clase === 'PORTADRON' && e.tipoEquipo === 'AEREO').length;
        const cantPortaNaval = elementos.filter((e) => e.clase === 'PORTADRON' && e.tipoEquipo === 'NAVAL').length;
        const cantDronAereo = elementos.filter((e) => e.clase === 'DRON' && e.tipoEquipo === 'AEREO').length;
        const cantDronNaval = elementos.filter((e) => e.clase === 'DRON' && e.tipoEquipo === 'NAVAL').length;
        console.log('[Game] Portadrones extraidos -> AEREO:', cantPortaAereo, 'NAVAL:', cantPortaNaval);
        console.log('[Game] Drones extraidos -> AEREO:', cantDronAereo, 'NAVAL:', cantDronNaval);
        elementos
            .filter((e) => e.clase === 'PORTADRON')
            .forEach((e) => {
                console.log('[Game] Portadron:', e.id, 'tipoEquipo:', e.tipoEquipo, 'textura:', this.obtenerTexturaElemento(e));
            });
        this.guardarElementos(elementos);
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
            this.txtModo.setText(`CONTROL ${this.controlMode}`);
        }
    }

    seleccionarDron(spriteDron) {
        if (!spriteDron) {
            return;
        }

        const dronId = spriteDron.getData('elementId') || spriteDron.id;
        const clavePropia = this.buscarClaveExistentePorId(dronId);
        if (clavePropia) {
            const dronEstadoPropio = this.elementosEstado.get(clavePropia);
            if (dronEstadoPropio && !this.esElementoPropio(dronEstadoPropio)) {
                return;
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

        this.controlMode = 'DRON';
        this.activeDron = spriteDron;
        this.lastSelectedDronId = dronId;
        this.dronesActivados.add(String(dronId));

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
        if (this.txtModo) {
            this.txtModo.setText(`CONTROL ${this.controlMode}`);
        }
    }

    volverAlPortadron() {
        this.controlMode = 'PORTADRONES';
        this.activeDron = null;
        if (this.unit) {
            this.cameras.main.startFollow(this.unit, true, 0.08, 0.08);
            this.actualizarVisionPorObjeto(this.unit);
        }
        this.dibujarVision();
        this.actualizarHUDDesdePortadronActivo(this.unit);
        if (this.txtModo) {
            this.txtModo.setText(`CONTROL ${this.controlMode}`);
        }
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
        let angulo = objetivo.angle || 0;
        if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            angulo = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
        }

        this.solicitarMovimientoObjetivo(objetivo, targetX, targetY, angulo);
    }

    actualizarVisionPorObjeto(objeto) {
        if (!objeto) {
            return;
        }

        const team = objeto.getData ? objeto.getData('elementTeam') : null;
        if (team === 'AEREO') {
            this.visionRange = this.visionRangeAereo;
        } else {
            this.visionRange = this.visionRangeNaval;
        }
    }

    solicitarMovimientoObjetivo(elemento, x, y, angulo) {
        if (!elemento) {
            return;
        }

        if (this.pendingMoveRequest) {
            return;
        }

        const elementId = elemento.getData ? elemento.getData('elementId') : elemento.id;
        if (elementId === undefined || elementId === null) {
            return;
        }

        let z = 0;
        const zDato = elemento.getData ? elemento.getData('elementZ') : undefined;
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
            console.warn('[Game] movimiento fallido', msg.mensaje || msg.Mensaje || msg);
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
        this.unit.angle = portaPropio.angulo || 0;
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

                elementos.push({
                    id: porta.id,
                    clave: `PORTADRON_${tipoEquipo}_${porta.id}`,
                    clase: 'PORTADRON',
                    tipoEquipo: tipoEquipo,
                    x: Number(porta.x) || 0,
                    y: Number(porta.y) || 0,
                    z: Number(porta.z) || 0,
                    angulo: Number(porta.angulo) || 0,
                    vida: Number(porta.vida) || 0,
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

                    const listaMisiles = Array.isArray(dron.listaMisiles) ? dron.listaMisiles : [];
                    const listaBombas = Array.isArray(dron.listaBombas) ? dron.listaBombas : [];
                    const listaMuniciones = Array.isArray(dron.listaMuniciones) ? dron.listaMuniciones : [];
                    const municionDisponible =
                        Number(dron.municionDisponible ?? dron.cantidadMunicionesDisponibles ?? dron.municion ?? NaN);

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

                    let tipoMunicion = tipoEquipo === 'AEREO' ? 'BOMBA' : 'MISIL';
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

    obtenerClaveElemento(elemento) {
        if (!elemento) {
            return '';
        }

        if (elemento.clave) {
            return String(elemento.clave);
        }

        const clase = elemento.clase || 'ELEMENTO';
        const tipoEquipo = elemento.tipoEquipo || 'NA';
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

    obtenerFactorTamanoPorZ(z, clase) {
        const zNumerico = Number(z) || 0;
        const minFactor = clase === 'DRON' ? 0.75 : 0.85;
        const maxFactor = clase === 'DRON' ? 1.15 : 1.35;
        const factorBase = 1 + (zNumerico * 0.003);
        return Phaser.Math.Clamp(factorBase, minFactor, maxFactor);
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

    esElementoPropio(elemento) {
        if (!elemento) {
            return false;
        }

        if (this.ownPortadronId !== null && this.ownPortadronId !== undefined) {
            if (elemento.clase === 'PORTADRON') {
                return String(elemento.id) === String(this.ownPortadronId);
            }

            if (elemento.clase === 'DRON') {
                return String(elemento.parentPortadronId) === String(this.ownPortadronId);
            }
        }

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
            if (!this.esEstadoActivo(elemento.estado)) {
                this.ocultarElemento(id);
                return;
            }

            if (elemento.clase === 'PORTADRON' && this.ownPortadronKey !== null && String(id) === String(this.ownPortadronKey)) {
                this.ocultarElemento(id);
                this.actualizarLifebarPortadron(elemento, this.unit, id);

                let labelPropio = this.elementosLabels.get(id);
                const textoPropio = `PORTADRON ${String(elemento.tipoEquipo || '').toUpperCase()}`;
                const labelX = this.unit ? this.unit.x : elemento.x;
                const labelY = this.unit ? this.unit.y - 20 : elemento.y - 20;

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
            const factorTamano = this.obtenerFactorTamanoPorZ(elemento.z, elemento.clase);

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
            if (esLocal) {
                sprite.setInteractive({ useHandCursor: true });
                if (elemento.clase === 'DRON') {
                    sprite.removeAllListeners('pointerdown');
                    sprite.on('pointerdown', () => {
                        this.seleccionarDron(sprite);
                    });
                } else if (elemento.clase === 'PORTADRON') {
                    sprite.removeAllListeners('pointerdown');
                    sprite.on('pointerdown', () => {
                        this.seleccionarPortadron(sprite);
                    });
                }
            } else {
                sprite.disableInteractive();
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
                this.actualizarLifebarPortadron(elemento, sprite, id);
            } else {
                this.ocultarLifebar(id);
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

    actualizarLifebarPortadron(elemento, sprite, keyElemento) {
        const maxVida = 100;
        const vida = Number(elemento.vida) || 0;
        const vidaClamped = Phaser.Math.Clamp(vida, 0, maxVida);
        const porcentaje = vidaClamped / maxVida;

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

    actualizarRealidad(data) {
        if (!data) {
            return;
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
                const existente = this.elementosEstado.get(claveExistente) || {};
                const actualizado = {
                    ...existente,
                    id: e.id,
                    x: Number(e.x ?? e.posicionX ?? existente.x ?? 0),
                    y: Number(e.y ?? e.posicionY ?? existente.y ?? 0),
                    z: Number(e.z ?? e.posicionZ ?? existente.z ?? 0),
                    angulo: Number(e.angulo ?? existente.angulo ?? 0),
                    vida: Number(e.vida ?? existente.vida ?? 0),
                    estado: e.estado || existente.estado || 'ACTIVO',
                    bateria: Number(e.bateria ?? existente.bateria ?? 0),
                    tipoMunicion: e.tipoMunicion || existente.tipoMunicion,
                    municionDisponible: Number(e.municionDisponible ?? e.municion ?? e.cantidadMunicionesDisponibles ?? existente.municionDisponible ?? 0)
                };

                if (!actualizado.clase) {
                    actualizado.clase = 'DRON';
                }
                if (!actualizado.tipoEquipo) {
                    actualizado.tipoEquipo = 'NAVAL';
                }

                const claveActualizada = this.obtenerClaveElemento(actualizado);
                if (claveExistente && claveExistente !== claveActualizada) {
                    this.elementosEstado.delete(claveExistente);
                }
                this.elementosEstado.set(claveActualizada, actualizado);
            });

            this.renderizarElementos();
            this.renderizarProyectiles();
            this.colocarUnidadSegunEquipo();
            if (this.controlMode === 'DRON') {
                this.actualizarHUDDesdeDronActivo();
            } else {
                this.actualizarHUDDesdePortadronActivo(this.unit);
            }
            this.dibujarVision();
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
        const actualizado = {
            ...existente,
            id: id,
            clase: this.normalizarTipoProyectil(e),
            x: Number(e.x ?? e.posicionX ?? existente.x ?? 0),
            y: Number(e.y ?? e.posicionY ?? existente.y ?? 0),
            z: Number(e.z ?? e.posicionZ ?? existente.z ?? 0),
            angulo: Number(e.angulo ?? existente.angulo ?? 0),
            estado: e.estado || existente.estado || 'ACTIVO',
            tipoEquipo: e.tipoEquipo || existente.tipoEquipo || null,
            velocidad: Number(e.velocidad ?? existente.velocidad ?? 0),
            alcance: Number(e.alcance ?? existente.alcance ?? 0),
            radioExplosion: Number(e.radioExplosion ?? existente.radioExplosion ?? 0)
        };

        if (!this.esEstadoActivo(actualizado.estado)) {
            this.ocultarProyectil(id);
            this.proyectilesEstado.delete(id);
            return;
        }

        this.proyectilesEstado.set(id, actualizado);
    }

    renderizarProyectiles() {
        this.proyectilesEstado.forEach((proyectil, id) => {
            if (!this.esEstadoActivo(proyectil.estado)) {
                this.ocultarProyectil(id);
                this.proyectilesEstado.delete(id);
                return;
            }

            let sprite = this.proyectilesSprites.get(id);
            const textura = proyectil.clase === 'BOMBA' ? 'proyectil_bomba' : 'proyectil_misil';
            const anchoBase = proyectil.clase === 'BOMBA' ? 20 : 34;
            const altoBase = proyectil.clase === 'BOMBA' ? 20 : 14;

            if (!sprite) {
                sprite = this.add.sprite(proyectil.x, proyectil.y, textura);
                this.proyectilesSprites.set(id, sprite);
            } else if (sprite.setTexture) {
                sprite.setTexture(textura);
            } else {
                sprite.destroy();
                sprite = this.add.sprite(proyectil.x, proyectil.y, textura);
                this.proyectilesSprites.set(id, sprite);
            }

            sprite.setPosition(proyectil.x, proyectil.y);
            sprite.setAngle(proyectil.angulo || 0);

            const factor = Phaser.Math.Clamp(1 + ((Number(proyectil.z) || 0) * 0.003), 0.6, 1.5);
            sprite.setDisplaySize(anchoBase * factor, altoBase * factor);
            sprite.setDepth((Number(proyectil.z) || 0) + 0.8);
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
        // la máscara no necesita color, pero rellenamos con blanco opaco para que el
        // gráfico genere el contorno que utiliza el GeometryMask
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

    emitirDisparo(pointer) {
        const dronId = this.activeDron?.getData('elementId') || this.activeDron?.id;
        if (!dronId) {
            return;
        }

        if (this.pendingShotRequest) {
            return;
        }

        this.pendingShotRequest = {
            dronId: Number(dronId),
            clickX: Number(pointer?.worldX ?? this.activeDron?.x ?? 0),
            clickY: Number(pointer?.worldY ?? this.activeDron?.y ?? 0)
        };

        const enviado = this.enviarAlSocket({
            tipo: "DISPARAR",
            IdDron: dronId
        });

        if (!enviado) {
            this.pendingShotRequest = null;
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
            console.warn('[Game] disparo fallido', msg.mensaje || msg.Mensaje || msg);
        }
        this.pendingShotRequest = null;
    }

    actualizarHUDDesdeDronActivo() {
        if (!this.activeDron) {
            return;
        }

        const dronId = this.activeDron.getData('elementId') || this.activeDron.id;
        const clave = this.buscarClaveExistentePorId(dronId);
        if (!clave) {
            return;
        }

        const dron = this.elementosEstado.get(clave);
        if (!dron || dron.clase !== 'DRON') {
            return;
        }

        this.actualizarHUD({
            vida: this.formatearVidaPorcentaje(dron.vida, dron.estado),
            bateria: this.formatearPorcentaje(dron.bateria),
            municion: this.formatearCantidad(dron.municionDisponible)
        });
    }

    actualizarHUDDesdePortadronActivo(spritePortadron) {
        const portaId = spritePortadron?.getData?.('elementId') || spritePortadron?.id || this.ownPortadronId;
        if (portaId === undefined || portaId === null) {
            return;
        }

        const clave = this.buscarClaveExistentePorId(portaId);
        if (!clave) {
            return;
        }

        const porta = this.elementosEstado.get(clave);
        if (!porta || porta.clase !== 'PORTADRON') {
            return;
        }

        this.actualizarHUD({
            vida: this.formatearVidaPorcentaje(porta.vida, porta.estado),
            bateria: 'N/A',
            municion: 'N/A'
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

        const elementId = elemento.getData ? elemento.getData('elementId') : elemento.id;
        if (elementId === undefined || elementId === null) {
            return;
        }

        let z = 0;
        const zDato = elemento.getData ? elemento.getData('elementZ') : undefined;
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
        this.txtVida = this.add.text(20, this.scale.height - 92, 'VIDA: ---', estiloSecundario).setScrollFactor(0).setDepth(9500);
        this.txtBateria = this.add.text(20, this.scale.height - 62, 'BATERÍA: ---', estiloSecundario).setScrollFactor(0).setDepth(9500);
        this.txtMunicion = this.add.text(20, this.scale.height - 32, 'MUNICIÓN: ---', estiloSecundario).setScrollFactor(0).setDepth(9500);
        this.txtEquipo.setShadow(0, 0, '#e1f1f19a', 16, true, true);
        this.txtModo.setShadow(0, 0, '#e1f1f19a', 16, true, true);
        this.txtVida.setShadow(0, 0, '#e1f1f19a', 12, true, true);
        this.txtBateria.setShadow(0, 0, '#e1f1f19a', 12, true, true);
        this.txtMunicion.setShadow(0, 0, '#e1f1f19a', 12, true, true);
    }

    actualizarHUD(datosUnidad) {
        if (!datosUnidad) return;
        if (this.txtVida) this.txtVida.setText(`VIDA: ${datosUnidad.vida}`);
        if (this.txtBateria) this.txtBateria.setText(`BATERÍA: ${datosUnidad.bateria}`);
        if (this.txtMunicion) this.txtMunicion.setText(`MUNICIÓN: ${datosUnidad.municion}`);
        if (this.txtModo) this.txtModo.setText(`CONTROL ${this.controlMode}`);
    }

    shutdown() {
        this.elementosLifebars.forEach((barra) => {
            if (barra.fondo) {
                barra.fondo.destroy();
            }
            if (barra.relleno) {
                barra.relleno.destroy();
            }
        });
        this.elementosLifebars.clear();

        this.proyectilesSprites.forEach((sprite) => {
            sprite.destroy();
        });
        this.proyectilesSprites.clear();
        this.proyectilesEstado.clear();
    }
}