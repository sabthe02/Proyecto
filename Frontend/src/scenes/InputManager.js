
export class InputManager {
    constructor(scene, network, playerId, portadronId) {
        this.scene = scene;
        this.network = network;
        this.playerId = playerId;
        
        // Estado de vista: 'PORTADRON' o 'DRON'
        this.vistaActual = 'PORTADRON';
        this.idPortadron = portadronId; // ID del portadrón del jugador
        this.idDronActivo = null; // ID del dron desplegado activo
        this.elementoActivo = portadronId; // Elemento actualmente controlado
        
        console.log(`[InputManager] Inicializado - playerId: ${playerId}, portadronId inicial: ${portadronId}`);
        
        // Referencia al UIManager para actualizar vista
        this.uiManager = null; // Será configurado desde Game.js
        
        // Agregar Spacebar para cambiar vista PORTADRON <-> DRON activo
        if (scene.input.keyboard) {
            scene.input.keyboard.on('keydown-SPACE', () => {
                console.log(`[InputManager] Spacebar presionado - Vista actual: ${this.vistaActual}, idDronActivo: ${this.idDronActivo}, idPortadron: ${this.idPortadron}`);
                this.cambiarVista();
            });
        } else {
            console.warn('[InputManager] scene.input.keyboard no disponible, Spacebar deshabilitado');
        }

        // Tracking de última posición del mouse para movimiento continuo
        this.ultimaPosicionEnviada = { x: 0, y: 0 };
        this.cooldownMovimiento = 0; // Milisegundos para evitar spam
        
        // Configurar mouse: movimiento para mover, clic izquierdo para disparar/desplegar
        scene.input.on('pointermove', (pointer) => {
            this.procesarMovimiento(pointer.worldX, pointer.worldY);
        });
        
        scene.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) return; // Ignorar clic derecho
            
            // Clic izquierdo depende de la vista actual
            if (this.vistaActual === 'PORTADRON') {
                this.procesarDespliegue();
            } else if (this.vistaActual === 'DRON') {
                this.procesarDisparo();
            }
        });
        
        // Escuchar eventos del backend para actualizar estado
        this.escucharEventos();
    }
    
    configurarPortadron(portadronId) {
        // Configurar el portadrón del jugador después de PARTIDA_INICIADA
        console.log(`[InputManager] configurarPortadron llamado con ID: ${portadronId}`);
        this.idPortadron = portadronId;
        this.elementoActivo = portadronId;
        console.log(`[InputManager] Portadrón configurado: ${this.idPortadron}, elementoActivo: ${this.elementoActivo}`);
    }
    
    configurarUIManager(uiManager) {
        // Conectar con UIManager para actualizar vista en HUD
        this.uiManager = uiManager;
    }

    escucharEventos() {
        // Escuchar actualizaciones del backend para detectar dron ACTIVO
        this.scene.events.on('ACTUALIZAR_PARTIDA', (data) => {
            // Buscar el dron ACTIVO del jugador (soportar idJugador o jugadorId)
            const gameData = data.datos || data;
            
            // FILTRO: Solo drones que pertenecen a ESTE jugador
            const misDrones = gameData.elementos?.filter(e => 
                e.clase === 'DRON' && 
                (e.idJugador === this.playerId || e.jugadorId === this.playerId)
            ) || [];
            
            // Buscar algún dron ACTIVO del jugador
            const dronActivo = misDrones.find(e => e.estado === 'ACTIVO');
            
            // Actualizar el ID del dron activo si se encuentra uno
            if (dronActivo) {
                if (this.idDronActivo !== dronActivo.id) {
                    console.log(`[InputManager] Dron activo detectado: ID=${dronActivo.id} (${misDrones.length} drones mios, ${misDrones.filter(d => d.estado === 'ACTIVO').length} activos)`);
                    this.idDronActivo = dronActivo.id;
                    
                    // Auto-cambiar a vista dron tras despliegue
                    if (this.vistaActual === 'PORTADRON') {
                        console.log('[InputManager] Auto-cambiando a vista DRON tras despliegue');
                        this.cambiarVista();
                    }
                }
            } else {
                // DEBUG: Mostrar qué drones tengo y sus estados
                if (misDrones.length > 0) {
                    const estadosDrones = misDrones.map(d => `ID=${d.id} estado=${d.estado}`).join(', ');
                    console.log(`[InputManager] Mis drones: ${estadosDrones}`);
                }
                // Solo limpiar idDronActivo si estábamos rastreando un dron
                // No limpiar en la primera actualización cuando todavía no hay drones desplegados
                if (this.idDronActivo !== null) {
                    // Verificar si el dron fue destruido (buscar con estado DESTRUIDO)
                    const dronDestruido = gameData.elementos?.find(e => 
                        e.clase === 'DRON' && 
                        e.id === this.idDronActivo &&
                        e.estado === 'DESTRUIDO'
                    );
                    
                    if (dronDestruido || !gameData.elementos?.some(e => e.id === this.idDronActivo)) {
                        console.log('[InputManager] Dron activo ya no disponible o destruido');
                        this.idDronActivo = null;
                        
                        // Si estábamos en vista dron, volver a portadrón
                        if (this.vistaActual === 'DRON') {
                            console.log('[InputManager] Volviendo a vista PORTADRON (dron perdido)');
                            this.vistaActual = 'PORTADRON';
                            this.elementoActivo = this.idPortadron;
                            if (this.uiManager) {
                                this.uiManager.actualizarVista('PORTADRON');
                            }
                        }
                    }
                }
            }
        });
    }

    update() {
        // NO keyboard controls - solo mouse
        
        // Reducir cooldown de movimiento
        if (this.cooldownMovimiento > 0) {
            this.cooldownMovimiento -= this.scene.game.loop.delta;
        }
    }

    cambiarVista() {
        console.log(`[InputManager] cambiarVista llamado - vistaActual: ${this.vistaActual}, idDronActivo: ${this.idDronActivo}, idPortadron: ${this.idPortadron}`);
        
        if (this.vistaActual === 'PORTADRON') {
            // Intentar cambiar a vista de dron
            if (this.idDronActivo !== null && this.idDronActivo !== undefined) {
                this.vistaActual = 'DRON';
                this.elementoActivo = this.idDronActivo;
                console.log(`[InputManager] Vista cambiada a DRON (ID: ${this.idDronActivo})`);
                
                // Actualizar UI si está disponible
                if (this.uiManager) {
                    this.uiManager.actualizarVista('DRON');
                }
            } else {
                console.warn(`[InputManager] [WARN] No se puede cambiar a DRON - no hay dron activo (idDronActivo: ${this.idDronActivo})`);
            }
        } else if (this.vistaActual === 'DRON') {
            // Cambiar a vista de portadrón
            this.vistaActual = 'PORTADRON';
            this.elementoActivo = this.idPortadron;
            console.log(`[InputManager] Vista cambiada a PORTADRON (ID: ${this.idPortadron})`);
            
            // Actualizar UI si está disponible
            if (this.uiManager) {
                this.uiManager.actualizarVista('PORTADRON');
            }
        } else {
            console.warn(`[InputManager] [WARN] Estado de vista desconocido: ${this.vistaActual}`);
        }
    }

    procesarMovimiento(targetX, targetY) {
        // Evitar enviar demasiadas actualizaciones de movimiento (rate limiting)
        if (this.cooldownMovimiento > 0) return;
        
        // Verificar que la posición haya cambiado significativamente
        const dx = targetX - this.ultimaPosicionEnviada.x;
        const dy = targetY - this.ultimaPosicionEnviada.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia < 10) return; // Ignorar movimientos muy pequeños
        
        // Enviar comando de movimiento al backend
        this.network.send('MOVER_ELEMENTO', {
            idElemento: this.elementoActivo,
            PosicionX: Math.round(targetX),
            PosicionY: Math.round(targetY),
            PosicionZ: 0, // Z no se usa en movimientos de superficie (solo bombardeos)
            Angulo: 0 // El ángulo se calcula por dirección de movimiento en backend
        });
        
        this.ultimaPosicionEnviada = { x: targetX, y: targetY };
        this.cooldownMovimiento = 100; // Cooldown de 100ms entre movimientos
    }

    procesarDespliegue() {
        // Solicitar desplegar dron desde el portadrón
        console.log(`[InputManager] procesarDespliegue - idPortadron: ${this.idPortadron}, vistaActual: ${this.vistaActual}`);
        if (this.idPortadron === null || this.idPortadron === undefined) {
            console.error(`[InputManager] ERROR - No hay portadrón configurado para desplegar. Estado: idPortadron=${this.idPortadron}, elementoActivo=${this.elementoActivo}, playerId=${this.playerId}`);
            return;
        }
        console.log(`[InputManager] Desplegando dron desde portadron ID: ${this.idPortadron}`);
        this.network.send('DESPLEGAR', {
            IdPortaDron: this.idPortadron
        });
    }

    procesarDisparo() {
        if (!this.idDronActivo) {
            console.warn('No hay dron activo para disparar');
            return;
        }
        
        // Enviar comando de disparo (sin coordenadas - el backend usa la última posición del MOVER_ELEMENTO)
        console.log(`Disparando dron ${this.idDronActivo}`);
        this.network.send('DISPARAR', {
            IdDron: this.idDronActivo
        });
    }

    procesarRecarga() {
        if (!this.idDronActivo) {
            console.warn('No hay dron activo para recargar');
            return;
        }
        
        console.log(`Recargando dron ${this.idDronActivo}`);
        this.network.send('RECARGAR', {
            IdDron: this.idDronActivo
        });
    }
}