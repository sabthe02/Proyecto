export class UIManager {
    constructor(scene) {
        this.scene = scene;

        
        this.textStyle = {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };
        
        // Backend usa escala de game ticks (e.g., 1000 = 100%)
        // Rastreamos max valores para calcular porcentajes de visualización
        this.vidaMax = null;
        this.bateriaMax = null;

        this.crearHUD();
        this.escucharEventos();
    }

    crearHUD() {
        // Textos de información del jugador
        this.vidaTexto = this.scene.add.text(20, 20, 'VIDA: 100%', this.textStyle).setScrollFactor(0).setDepth(1000);
        this.bateriaTexto = this.scene.add.text(20, 50, 'BATERÍA: 100%', this.textStyle).setScrollFactor(0).setDepth(1000).setVisible(false);
        
        // Mostrar equipo del jugador
        const playerTeam = this.scene.playerTeam || 'DESCONOCIDO';
        this.equipoTexto = this.scene.add.text(20, 80, 'EQUIPO: ' + playerTeam, { ...this.textStyle, fontSize: '14px' }).setScrollFactor(0).setDepth(1000);
        
        // Texto de vista actual
        this.vistaTexto = this.scene.add.text(20, 110, 'VISTA: PORTADRON', { ...this.textStyle, fontSize: '14px' }).setScrollFactor(0).setDepth(1000);
        
        // Estado actual de vista (para controlar qué mostrar)
        this.vistaActual = 'PORTADRON';
        
        // Indicador de latencia (esquina superior derecha) - oculto por defecto
        this.latenciaTexto = this.scene.add.text(
            this.scene.scale.width - 120, 
            20, 
            '', 
            { fontSize: '14px', fill: '#888888', stroke: '#000000', strokeThickness: 3 }
        ).setScrollFactor(0).setDepth(1000).setOrigin(0, 0).setVisible(false);
    }

    escucharEventos() {
        // Cuando el server mande actualización, la UI reacciona
        this.scene.events.on('ACTUALIZAR_PARTIDA', (data) => {
            // Backend sends: {tipo: 'ACTUALIZAR_PARTIDA', datos: {elementos: [...]}}
            const gameData = data.datos || data;
            
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
                this.actualizar(elementoActivo.vida, elementoActivo.bateria, elementoActivo.x, elementoActivo.y);
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
        
        // Escuchar actualizaciones de latencia del NetworkManager
        this.scene.events.on('LATENCY_UPDATE', (ms) => {
            this.actualizarLatencia(ms);
        });
    }
    
    actualizarLatencia(ms) {
        // Colorear según latencia: verde (<50ms), amarillo (<150ms), rojo (>=150ms)
        let color;
        if (ms < 50) {
            color = '#00ff00'; // Verde
        } else if (ms < 150) {
            color = '#ffff00'; // Amarillo
        } else {
            color = '#ff0000'; // Rojo
        }
        
        this.latenciaTexto.setText(`PING: ${Math.round(ms)}ms`).setFill(color);
    }

    actualizar(vida, bateria, x, y) {
        // Backend usa escala de game ticks - convertir a porcentaje para UI
        // Detectar max valores dinámicamente
        if (this.vidaMax === null || vida > this.vidaMax) {
            this.vidaMax = vida;
        }
        if (this.bateriaMax === null || bateria > this.bateriaMax) {
            this.bateriaMax = bateria;
        }
        
        // Calcular porcentajes para mostrar al jugador
        const vidaPorcentaje = this.vidaMax > 0 ? Math.floor((vida / this.vidaMax) * 100) : 0;
        const bateriaPorcentaje = this.bateriaMax > 0 ? Math.floor((bateria / this.bateriaMax) * 100) : 0;
        
        // Mostrar solo vida o batería según la vista actual
        if (this.vistaActual === 'PORTADRON') {
            // Vista portadrón: mostrar VIDA (portadrones tienen vida, no batería)
            this.vidaTexto.setText(`VIDA: ${vidaPorcentaje}%`).setVisible(true);
            this.bateriaTexto.setVisible(false);
            this.vidaTexto.setFill(vidaPorcentaje < 30 ? '#ff0000' : '#ffffff');
        } else {
            // Vista dron: mostrar BATERÍA (drones tienen batería, no vida significativa)
            this.bateriaTexto.setText(`BATERÍA: ${bateriaPorcentaje}%`).setVisible(true);
            this.vidaTexto.setVisible(false);
            this.bateriaTexto.setFill(bateriaPorcentaje < 30 ? '#ff0000' : '#ffffff');
        }
    }
    
    actualizarVista(vista) {
        // Actualizar texto de vista actual (PORTADRON o DRON)
        this.vistaActual = vista;
        this.vistaTexto.setText(`VISTA: ${vista}`);
        
        // Actualizar visibilidad de vida/batería según la vista
        if (vista === 'PORTADRON') {
            this.vidaTexto.setVisible(true);
            this.bateriaTexto.setVisible(false);
        } else {
            this.vidaTexto.setVisible(false);
            this.bateriaTexto.setVisible(true);
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
        .setScrollFactor(0);
        
        // Desvanecer y destruir después de 3 segundos
        this.scene.tweens.add({
            targets: errorTexto,
            alpha: 0,
            duration: 1000,
            delay: 2000,
            onComplete: () => errorTexto.destroy()
        });
    }

    mostrarMensajeMuerte() {
        const screenCenter = this.scene.scale.width / 2;
        this.scene.add.text(screenCenter, 300, 'DRON DESTRUIDO', { fontSize: '64px', fill: '#ff0000' })
            .setOrigin(0.5)
            .setScrollFactor(0);
    }
}