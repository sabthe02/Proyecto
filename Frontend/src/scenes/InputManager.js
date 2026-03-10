
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
        this.dronEnRecarga = null; // ID del dron que acaba de ser recargado (para evitar race condition)
        
        // InputManager inicializado
        
        // Referencia al UIManager para actualizar vista
        this.uiManager = null; // Será configurado desde Game.js
        
        // Agregar Spacebar para cambiar vista PORTADRON <-> DRON activo
        if (scene.input.keyboard) {
            // Asegurar que el teclado capture las teclas
            scene.input.keyboard.enableGlobalCapture();
            
            // Usar addKey para mejor compatibilidad
            this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.spaceKey.on('down', () => {
                console.log(`Space detectado - Vista actual: ${this.vistaActual}, idDronActivo: ${this.idDronActivo}, idPortadron: ${this.idPortadron}`);
                this.cambiarVista();
            });
            
            // Agregar tecla I para mostrar vista de impacto (se maneja en Game.js, pero asegurar que se capture)
            this.iKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
            this.iKey.on('down', () => {
                console.log('I detectado');
            });
            
            // Agregar R para recargar dron (solo funciona en vista DRON)
            this.rKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
            this.rKey.on('down', () => {
                console.log(`Tecla r detectada - Vista actual: ${this.vistaActual}`);
                if (this.vistaActual === 'DRON') {
                    this.procesarRecarga();
                } else {
                    console.log('R solo funciona en vista DRON');
                }
            });
            
            console.log('Teclado configurado: SPACE (cambiar vista), I (probar impacto), R (recargar)');
        } else {
            console.warn('scene.input.keyboard no disponible, controles de teclado deshabilitados');
        }

        // Tracking de última posición del mouse para movimiento continuo
        this.ultimaPosicionEnviada = { x: 0, y: 0 };
        this.ultimaPosicionMouse = { x: 0, y: 0 }; // Última posición del mouse (incluye clics)
        this.cooldownMovimiento = 0; // Milisegundos para evitar spam
        
        // Configurar mouse: movimiento para mover, clic izquierdo para disparar/desplegar
        scene.input.on('pointermove', (pointer) => {
            this.ultimaPosicionMouse.x = pointer.worldX;
            this.ultimaPosicionMouse.y = pointer.worldY;
            this.procesarMovimiento(pointer.worldX, pointer.worldY);
        });
        
        scene.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                console.log('Click derecho ignorado');
                return; // Ignorar clic derecho
            }
            
            // Actualizar última posición del mouse con la posición del clic
            this.ultimaPosicionMouse.x = pointer.worldX;
            this.ultimaPosicionMouse.y = pointer.worldY;
            
            const worldX = Math.round(pointer.worldX);
            const worldY = Math.round(pointer.worldY);
            console.log(`Click izquierdo en (${worldX}, ${worldY}) - Vista: ${this.vistaActual}, idDronActivo: ${this.idDronActivo}, elementoActivo: ${this.elementoActivo}`);
            
            // Clic izquierdo depende de la vista actual
            if (this.vistaActual === 'PORTADRON') {
        // Desplegar dron
                this.procesarDespliegue();
            } else if (this.vistaActual === 'DRON') {
        // Disparar
                this.procesarDisparo();
            } else {
                console.warn(`Vista desconocida: ${this.vistaActual}`);
            }
        });
        
        // Escuchar eventos del backend para actualizar estado
        this.escucharEventos();
    }
    
    configurarPortadron(portadronId) {
        // Configurar el portadrón del jugador después de PARTIDA_INICIADA
        this.idPortadron = portadronId;
        this.elementoActivo = portadronId;
        this.vistaActual = 'PORTADRON';
        console.log(`Portadron configurado: ID=${portadronId}, elementoActivo=${this.elementoActivo}`);
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
            
            // Solo drones que pertenecen a ESTE jugador
            // Los DTOs del backend no incluyen idJugador en actualizaciones, se busca en EntityManager como fallback
            const misDrones = gameData.elementos?.filter(e => {
                if (e.clase !== 'DRON') return false;
                if (e.idJugador === this.playerId || e.jugadorId === this.playerId) return true;
                const unidad = this.scene.entityManager?.unidades?.get(e.id);
                if (unidad && String(unidad.idJugador || unidad.jugadorId) === String(this.playerId)) return true;
                // Mapa de ownership construido desde PARTIDA_INICIADA (fuente autoritativa)
                return this.scene.droneJugadorMap?.get(String(e.id)) === String(this.playerId);
            }) || [];
            
            // Buscar algún dron ACTIVO del jugador
            const dronActivo = misDrones.find(e => e.estado === 'ACTIVO');
            
            // Actualizar el ID del dron activo si se encuentra uno NUEVO (comparar como numeros)
            if (dronActivo) {
                const dronActivoId = parseInt(dronActivo.id);
                let idActual = null;
                if (this.idDronActivo !== null) {
                    idActual = parseInt(this.idDronActivo);
                }
                
                // Ignorar el dron que acabamos de recargar hasta que el backend confirme el cambio de estado
                const esElDronRecargado = this.dronEnRecarga !== null && parseInt(this.dronEnRecarga) === dronActivoId;
                
                if (!esElDronRecargado && idActual !== dronActivoId) {
                    this.idDronActivo = dronActivo.id;
                    this.dronEnRecarga = null;
                    this.elementoActivo = dronActivo.id;
                    
                    // Auto-cambiar a vista dron tras despliegue
                    if (this.vistaActual === 'PORTADRON') {
                        this.cambiarVista();
                    }
                }
            }
            
            // Limpiar dronEnRecarga cuando el backend confirma que ya no está ACTIVO
            if (this.dronEnRecarga !== null) {
                const dronRecargado = gameData.elementos?.find(e =>
                    String(e.id) === String(this.dronEnRecarga) && e.estado === 'ACTIVO'
                );
                if (!dronRecargado) {
                    this.dronEnRecarga = null;
                }
            }
            
            // Solo limpiar idDronActivo y cambiar vista si el dron fue DESTRUIDO
            // NO cambiar vista si el dron simplemente no está en este update incremental
            if (this.idDronActivo !== null) {
                const miDronActual = gameData.elementos?.find(e => String(e.id) === String(this.idDronActivo));
                
                // Solo actuar si el dron ESTÁ presente en este update Y está DESTRUIDO
                // Ignorar si el dron no está en el update (puede ser un update incremental)
                if (miDronActual && miDronActual.estado === 'DESTRUIDO') {
                    // El dron existe en el update y está marcado como DESTRUIDO
                    console.log(`Dron ${this.idDronActivo} DESTRUIDO - volviendo a PORTADRON`);
                    this.idDronActivo = null;
                    
                    // Si la batería se agotó, esperar 1500ms para que la animación de caída se vea
                    const porBateria = miDronActual.bateria !== undefined && miDronActual.bateria <= 0;
                    const cambiarVista = () => {
                        if (this.vistaActual === 'DRON') {
                            this.vistaActual = 'PORTADRON';
                            this.elementoActivo = this.idPortadron;
                            if (this.uiManager) {
                                this.uiManager.actualizarVista('PORTADRON');
                            }
                        }
                    };
                    if (porBateria) {
                        this.scene.time.delayedCall(1500, cambiarVista);
                    } else {
                        cambiarVista();
                    }
                }
                // Si el dron no está en este update o está en cualquier otro estado, mantener vista actual
            }
        });
    }

    update() {
        // NO teclas - solo mouse
        
        // Reducir cooldown de movimiento
        if (this.cooldownMovimiento > 0) {
            this.cooldownMovimiento -= this.scene.game.loop.delta;
        }
    }

    cambiarVista() {
        // Cambiar vista
        
        if (this.vistaActual === 'PORTADRON') {
            // Intentar cambiar a vista de dron
            if (this.idDronActivo !== null && this.idDronActivo !== undefined) {
                this.vistaActual = 'DRON';
                this.elementoActivo = this.idDronActivo;
                // Vista cambiada a DRON
                
                // Actualizar UI si está disponible
                if (this.uiManager) {
                    this.uiManager.actualizarVista('DRON');
                }
            } else {
                console.warn(`No se puede cambiar a DRON - no hay dron activo (idDronActivo: ${this.idDronActivo}). Despliegue un dron primero.`);
            }
        } else if (this.vistaActual === 'DRON') {
            // Cambiar a vista de portadrón (siempre debe ser posible)
            if (!this.idPortadron) {
                console.error('Error, idPortadron no configurado. Forzando a null.');
            }
            this.vistaActual = 'PORTADRON';
            this.elementoActivo = this.idPortadron;
            // Vista cambiada a PORTADRON
            
            // Actualizar UI si está disponible
            if (this.uiManager) {
                this.uiManager.actualizarVista('PORTADRON');
            }
        } else {
            console.warn(`Estado de vista desconocido: ${this.vistaActual}, forzando a PORTADRON`);
            this.vistaActual = 'PORTADRON';
            this.elementoActivo = this.idPortadron;
            if (this.uiManager) {
                this.uiManager.actualizarVista('PORTADRON');
            }
        }
    }

    procesarMovimiento(targetX, targetY) {
        // Evitar enviar demasiadas actualizaciones de movimiento (rate limiting)
        if (this.cooldownMovimiento > 0) return;
        
        // Verificar que la posición haya cambiado significativamente
        const dx = targetX - this.ultimaPosicionEnviada.x;
        const dy = targetY - this.ultimaPosicionEnviada.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        if (distancia < 10) return; // Ignorar movimientos muy chicos
        
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
        // Procesando despliegue
        if (this.idPortadron === null || this.idPortadron === undefined) {
            console.error(`ERROR - No hay portadrón configurado para desplegar. Estado: idPortadron=${this.idPortadron}, elementoActivo=${this.elementoActivo}, playerId=${this.playerId}`);
            return;
        }
        // Desplegando dron
        this.network.send('DESPLEGAR', {
            IdPortaDron: this.idPortadron
        });
    }

    procesarDisparo() {
        if (!this.idDronActivo) {
            return;
        }
        // Always let backend decide if action is allowed
        this.network.send('DISPARAR', {
            IdDron: this.idDronActivo
        });
    }

    procesarRecarga() {
        // Solo en vista DRON - recargar el dron activo
        if (this.vistaActual !== 'DRON') {
            console.warn('Recarga solo funciona en vista DRON. Cambie a vista DRON primero (presione SPACE).');
            return;
        }
        
        if (!this.idDronActivo) {
            console.warn('No hay dron activo (idDronActivo es null)');
            return;
        }
        
        console.log(`Recargando dron ${this.idDronActivo} - cambiando a vista PORTADRON`);
        
        // Recordar qué dron se recargó para evitar que la race condition lo reactive
        this.dronEnRecarga = this.idDronActivo;
        
        // Enviar comando de recarga al backend
        this.network.send('RECARGAR', {
            IdDron: this.idDronActivo
        });
        
        // Cambiar inmediatamente a vista PORTADRON porque el dron entrará en estado CARGANDO
        // y el jugador querrá desplegar otro dron
        this.vistaActual = 'PORTADRON';
        this.elementoActivo = this.idPortadron;
        
        // Limpiar idDronActivo porque el dron ya no está bajo control directo
        this.idDronActivo = null;
        
        // Actualizar UI
        if (this.uiManager) {
            this.uiManager.actualizarVista('PORTADRON');
        }
    }
    
    reactivar() {
        // Reactivar input después de que la escena se reanuda
        console.log('Reactivando controles de teclado');
        
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = true;
            this.scene.input.keyboard.enableGlobalCapture();
            
            // Asegurar que las teclas estén habilitadas
            if (this.spaceKey) {
                this.spaceKey.enabled = true;
            }
            if (this.iKey) {
                this.iKey.enabled = true;
            }
            if (this.rKey) {
                this.rKey.enabled = true;
            }
            
            console.log('Teclado reactivado: SPACE, I, R activados');
        }
        
        // Restaurar foco del canvas
        if (this.scene.game.canvas) {
            this.scene.game.canvas.focus();
        }
    }
}