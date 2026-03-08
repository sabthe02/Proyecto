export class UIManager {
    constructor(scene) {
        this.scene = scene;

        this.estiloTexto = {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'Arial'
        };
        
        // Backend usa escala de game ticks (e.g., 1000 = 100%)
        // Rastreamos max valores para calcular porcentajes de visualización
        this.vidaMax = null;
        this.bateriaMax = null;

        this.crearHUD();
        this.escucharMensajesServidor();
    }

    crearHUD() {
        // Textos de información del jugador
        this.vidaTexto = this.scene.add.text(20, 20, 'VIDA: 100%', this.textStyle).setScrollFactor(0).setDepth(1000);
        this.bateriaTexto = this.scene.add.text(20, 50, 'BATERÍA: 100%', this.textStyle).setScrollFactor(0).setDepth(1000).setVisible(false);
        this.municionTexto = this.scene.add.text(20, 80, 'MUNICIÓN: 0/0', this.textStyle).setScrollFactor(0).setDepth(1000).setVisible(false);
        
        // Mostrar equipo del jugador
        const playerTeam = this.scene.playerTeam || 'DESCONOCIDO';
        this.equipoTexto = this.scene.add.text(20, 110, 'EQUIPO: ' + playerTeam, { ...this.textStyle, fontSize: '14px' }).setScrollFactor(0).setDepth(1000);
        
        // Texto de vista actual
        this.vistaTexto = this.scene.add.text(20, 140, 'VISTA: PORTADRON', { ...this.textStyle, fontSize: '14px' }).setScrollFactor(0).setDepth(1000);
        
        // Texto de estado de carga (solo visible cuando está cargando)
        this.cargaTexto = this.scene.add.text(20, 170, '', { ...this.textStyle, fontSize: '18px', fill: '#00ff00' }).setScrollFactor(0).setDepth(1000).setVisible(false);
        
        // Estado actual de vista (para controlar qué mostrar)
        this.vistaActual = 'PORTADRON';
        
        // Rastrear munición y estado previos para detectar cuando se completa la recarga
        this.previousMunicion = null;
        this.previousEstado = null;
        
    }

    escucharEventos() {
        // Cuando el servidor mande actualización, la UI reacciona
        this.scene.events.on('ACTUALIZAR_PARTIDA', (data) => {
            // El backend envía: {tipo: 'ACTUALIZAR_PARTIDA', datos: {elementos: [...]}}
            let gameData;
            if (data.datos) {
                gameData = data.datos;
            } else {
                gameData = data;
            }
            
            if (!gameData.elementos) {
                console.warn('UIManager: ACTUALIZAR_PARTIDA sin elementos');
                return;
            }
            
            // Obtener el ID del elemento activo desde InputManager
            const elementoActivoId = this.scene.inputManager?.elementoActivo;
            if (!elementoActivoId) {
                return; // No hay elemento activo todavía
            }
            
            // Buscar el elemento activo en la lista de elementos
            const elementoActivo = gameData.elementos.find(e => e.id == elementoActivoId);

            if (elementoActivo) {
                this.actualizar(elementoActivo.vida, elementoActivo.bateria, elementoActivo.x, elementoActivo.y, elementoActivo.municionDisponible, elementoActivo.estado, elementoActivo.comenzandoCarga);
            }
        });
        
        // Escuchar eventos de respuesta del backend
        this.scene.events.on('MOVIMIENTO_PROCESADO', () => {
            // Silencioso - el backend mandará ACTUALIZAR_PARTIDA con la nueva posición
        });
        
        this.scene.events.on('MOVIMIENTO_FALLIDO', (data) => {
            this.mostrarError('Error de movimiento: ' + (data.mensaje || 'Movimiento inválido'));
        });
        
        this.scene.events.on('DISPARO_PROCESADO', () => {
            // Silencioso - el backend mandará ACTUALIZAR_PARTIDA con el proyectil
        });
        
        this.scene.events.on('DISPARO_FALLIDO', (data) => {
            this.mostrarError('Error de disparo: ' + (data.mensaje || 'Disparo inválido'));
        });
        
    }


    actualizar(vida, bateria, x, y, municionDisponible, estado, comenzandoCarga) {
        // Backend usa escala de game ticks - convertir a porcentaje para UI
        // Detectar max valores dinámicamente
        if (this.vidaMax === null || vida > this.vidaMax) {
            this.vidaMax = vida;
        }
        if (this.bateriaMax === null || bateria > this.bateriaMax) {
            this.bateriaMax = bateria;
        }
        
        // Calcular porcentajes para mostrar al jugador
        let vidaPorcentaje;
        if (this.vidaMax > 0) {
            vidaPorcentaje = Math.floor((vida / this.vidaMax) * 100);
        } else {
            vidaPorcentaje = 0;
        }
        
        let bateriaPorcentaje;
        if (this.bateriaMax > 0) {
            bateriaPorcentaje = Math.floor((bateria / this.bateriaMax) * 100);
        } else {
            bateriaPorcentaje = 0;
        }
        
        // Mostrar solo vida o batería según la vista actual
        if (this.vistaActual === 'PORTADRON') {
            // Vista portadrón: mostrar VIDA (portadrones tienen vida, no batería)
            this.vidaTexto.setText(`VIDA: ${vidaPorcentaje}%`).setVisible(true);
            this.bateriaTexto.setVisible(false);
            this.municionTexto.setVisible(false);
            this.cargaTexto.setVisible(false);
            
            if (vidaPorcentaje < 30) {
                this.vidaTexto.setFill('#ff0000');
            } else {
                this.vidaTexto.setFill('#ffffff');
            }
            
            // Si un dron terminó de recargar (estaba CARGANDO, ahora INACTIVO en vista portadrón)
            // Mostrar notificación toast
            if (this.previousEstado === 'CARGANDO' && estado === 'INACTIVO') {
                this.mostrarToastExito('Munición agregada');
            }
        } else {
            // Vista dron: mostrar BATERÍA (drones tienen batería, no vida significativa)
            // Si el dron está en estado CARGANDO, mostrar mensaje especial
            if (estado === 'CARGANDO') {
                // Calcular porcentaje de carga (comenzandoCarga varía de 0 a 1000)
                let cargaPorcentaje;
                if (comenzandoCarga !== undefined) {
                    cargaPorcentaje = Math.floor((comenzandoCarga / 1000) * 100);
                } else {
                    cargaPorcentaje = 0;
                }
                
                this.cargaTexto.setText(`Estado de carga: ${cargaPorcentaje}%`).setVisible(true);
                this.bateriaTexto.setText(`BATERÍA: ${bateriaPorcentaje}%`).setVisible(true);
                this.bateriaTexto.setFill('#ffffff');
            } else {
                this.cargaTexto.setVisible(false);
                this.bateriaTexto.setText(`BATERÍA: ${bateriaPorcentaje}%`).setVisible(true);
                
                if (bateriaPorcentaje < 30) {
                    this.bateriaTexto.setFill('#ff0000');
                } else {
                    this.bateriaTexto.setFill('#ffffff');
                }
                
                // Si acaba de terminar de cargar mientras está en vista DRON
                if (this.previousEstado === 'CARGANDO' && estado === 'INACTIVO') {
                    this.mostrarToastExito('Munición agregada');
                }
            }
            this.vidaTexto.setVisible(false);
            
            // Mostrar munición disponible si está definida
            if (municionDisponible !== undefined && municionDisponible !== null) {
                // Máximo de municiones: NAVAL=2, AEREO=1
                let maxMunicion;
                if (this.scene.playerTeam === 'AEREO') {
                    maxMunicion = 1;
                } else {
                    maxMunicion = 2;
                }
                
                this.municionTexto.setText(`MUNICIÓN: ${municionDisponible}/${maxMunicion}`).setVisible(true);
                
                if (municionDisponible === 0) {
                    this.municionTexto.setFill('#ff0000');
                } else {
                    this.municionTexto.setFill('#ffffff');
                }
            } else {
                this.municionTexto.setVisible(false);
            }
        }
        
        // Rastrear cambios de estado para notificaciones toast
        this.previousMunicion = municionDisponible;
        this.previousEstado = estado;
    }
    
    actualizarVista(vista) {
        // Actualizar texto de vista actual (PORTADRON o DRON)
        this.vistaActual = vista;
        this.vistaTexto.setText(`VISTA: ${vista}`);
        
        // Actualizar visibilidad de vida/batería/munición según la vista
        if (vista === 'PORTADRON') {
            this.vidaTexto.setVisible(true);
            this.bateriaTexto.setVisible(false);
            this.municionTexto.setVisible(false);
            this.cargaTexto.setVisible(false);
        } else {
            this.vidaTexto.setVisible(false);
            this.bateriaTexto.setVisible(true);
            this.municionTexto.setVisible(true);
        }
    }
    
    mostrarError(mensaje) {
        // Mostrar mensaje de error temporal
        const errorTexto = this.scene.add.text(
            this.scene.scale.width / 2, 
            this.scene.scale.height - 100,
            mensaje,
            { 
                fontSize: '20px', 
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: '#000000aa',
                padding: { x: 10, y: 5 }
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000);
        
        // Desvanecer y destruir después de 3 segundos
        this.scene.tweens.add({
            targets: errorTexto,
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => errorTexto.destroy()
        });
    }
    
    mostrarToastExito(mensaje) {
        // Mostrar mensaje de éxito (verde) temporal
        const toastTexto = this.scene.add.text(
            this.scene.scale.width / 2, 
            this.scene.scale.height - 100,
            mensaje,
            { 
                fontSize: '20px', 
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: '#00000099',
                padding: { x: 15, y: 8 }
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000);
        
        // Desvanecer y destruir después de 2 segundos
        this.scene.tweens.add({
            targets: toastTexto,
            alpha: 0,
            duration: 800,
            delay: 1500,
            onComplete: () => toastTexto.destroy()
        });
    }

    notificarError(mensaje) {
        console.error("Servidor dice:", mensaje);
        this.logSistema.setText(`SISTEMA: ${mensaje}`).setFill('#ff5555');
        
        this.scene.time.delayedCall(5000, () => {
            this.logSistema.setFill('#aaaaaa');
        });
    }

    mostrarPantallaFinal(mensaje) {
        const { width, height } = this.scene.scale;
        
        const fondo = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8).setScrollFactor(0);
        const texto = this.scene.add.text(width/2, height/2, mensaje, { fontSize: '48px', fill: '#fff', align: 'center' })
            .setOrigin(0.5)
            .setScrollFactor(0);
    }
}