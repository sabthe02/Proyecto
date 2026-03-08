export class Drone extends Phaser.GameObjects.Container {
    constructor(scene, data) {
        super(scene, data.x, data.y);
        
        this.id = data.id;
        this.clase = 'DRON';
        this.tipoEquipo = data.tipoEquipo;
        
        let estadoInicial;
        if (data.estado) {
            estadoInicial = data.estado;
        } else {
            estadoInicial = 'INACTIVO';
        }
        this.estadoActual = estadoInicial;
        
        // Para saber a quién pertenece
        let idJugadorInicial;
        if (data.idJugador) {
            idJugadorInicial = data.idJugador;
        } else if (data.jugadorId) {
            idJugadorInicial = data.jugadorId;
        } else {
            idJugadorInicial = null;
        }
        this.idJugador = idJugadorInicial;
        
        this.jugadorId = this.idJugador; // Alias para compatibilidad
        this.portadronPadreId = data.portadronPadreId; // Si está en un portadrón
        
        // Backend usa MAX_BATERIA = 1000 ticks
        // Inicializar con el valor conocido del backend
        this.bateriaMax = 1000;

        let skin;
        if (this.tipoEquipo === 'AEREO') {
            skin = 'dron_aereo';
        } else {
            skin = 'dron_naval';
        }
        
        this.sprite = scene.add.sprite(0, 0, skin);
        // Escalar drones
        let escala;
        if (this.tipoEquipo === 'AEREO') {
            escala = 0.3;
        } else {
            escala = 0.25;
        }
        this.sprite.setScale(escala);
        this.add(this.sprite); // Lo metemos al contenedor
        
        // Drones por encima de portadrones
        let zInicial;
        if (data.z) {
            zInicial = data.z;
        } else {
            zInicial = 0;
        }
        this.setDepth(300 + zInicial);

        // Etiqueta
        this.label = scene.add.text(0, -45, `ID: ${this.id}`, { fontSize: '12px' }).setOrigin(0.5);
        this.add(this.label);

        // Barra de batería - asegurar que esté en la capa superior del contenedor
        this.barras = scene.add.graphics();
        this.barras.setDepth(10); // Depth relativo dentro del contenedor
        this.add(this.barras);

        // Si el dron está INACTIVO o CARGANDO, ocultarlo (está dentro del portadrón)
        if (this.estadoActual === 'INACTIVO' || this.estadoActual === 'CARGANDO') {
            this.setVisible(false);
        }
        
        scene.add.existing(this);
    }


    actualizarDesdeServidor(data) {
        // Animar movimiento suavemente en lugar de salto instantaneo
        this.scene.tweens.add({
            targets: this,
            x: data.x,
            y: data.y,
            angle: data.angulo,
            duration: 200,
            ease: 'Linear'
        });
        
        // Actualizar dueño si cambia
        if (data.idJugador !== undefined || data.jugadorId !== undefined) {
            let nuevoIdJugador;
            if (data.idJugador) {
                nuevoIdJugador = data.idJugador;
            } else if (data.jugadorId) {
                nuevoIdJugador = data.jugadorId;
            } else {
                nuevoIdJugador = this.idJugador;
            }
            this.idJugador = nuevoIdJugador;
            this.jugadorId = this.idJugador;
        }
        
        // Actualizar profundidad según altitud
        let zActual;
        if (data.z) {
            zActual = data.z;
        } else {
            zActual = 0;
        }
        this.setDepth(300 + zActual);
        
        // Aplicar indicadores visuales según estado
        if (data.estado && data.estado !== this.estadoActual) {
            this.aplicarEstadoVisual(data.estado);
            this.estadoActual = data.estado;
        }
        
        // Visibilidad: solo ACTIVO visible, INACTIVO/CARGANDO ocultos (en portadrón)
        if (data.estado === 'ACTIVO') {
            this.setVisible(true);
        } else if (data.estado === 'INACTIVO' || data.estado === 'CARGANDO') {
            this.setVisible(false);
        }
        
        // Drones muestran batería cuando ACTIVO o CARGANDO
        // ACTIVO: bateria drenandose en tiempo real
        // CARGANDO: bateria recargandose en portadron
        if (data.estado === 'ACTIVO' || data.estado === 'CARGANDO') {
            let bateria;
            if (data.bateria !== undefined) {
                bateria = data.bateria;
            } else {
                bateria = 100;
            }
            
            // Solo loguear si el valor es realmente anómalo
            if (bateria < 0 || bateria > 10000) {
                console.warn(`[Dron ${this.id}] Batería anómala del backend: ${bateria}`);
            }
            this.dibujarInterfazInterna(bateria);
        } else {
            // Limpiar barras si el dron no está activo ni cargando
            this.barras.clear();
        }
    }
    
    aplicarEstadoVisual(estado) {
        // Limpiar efectos previos
        this.sprite.clearTint();
        this.sprite.setAlpha(1.0);
        
        if (estado === 'ACTIVO') {
            // Tinta verde brillante para indicar que está activo
            this.sprite.setTint(0x88ff88);
            return;
        }
        
        if (estado === 'INACTIVO') {
            // Semi-transparente para inactivos
            this.sprite.setAlpha(0.5);
            return;
        }
        
        if (estado === 'CARGANDO') {
            // Tinta azulado pulsante
            this.sprite.setTint(0x8888ff);
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: { from: 0.5, to: 1.0 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
            return;
        }
        
        if (estado === 'DESTRUIDO') {
            // Será eliminado por EntityManager, no hacer nada
            return;
        }
    }

    dibujarInterfazInterna(bateria) {
        this.barras.clear();
        
        // Backend usa MAX_BATERIA = 1000
        // Calcular porcentaje basado en la escala del backend
        let bateriaPorcentaje;
        if (this.bateriaMax > 0 && bateria !== undefined && bateria !== null) {
            bateriaPorcentaje = Math.max(0, Math.min(1, bateria / this.bateriaMax));
        } else {
            bateriaPorcentaje = 0;
        }
        
        // Barra ajustada al tamaño del sprite escalado
        const barWidth = 30;
        const barHeight = 5;
        const barX = -barWidth / 2;
        const barY = -35; // Más arriba para que no se superponga con el sprite
        
        // Fondo gris oscuro con borde
        this.barras.lineStyle(1, 0xffffff, 0.8);
        this.barras.fillStyle(0x222222);
        this.barras.fillRect(barX, barY, barWidth, barHeight);
        this.barras.strokeRect(barX, barY, barWidth, barHeight);
        
        // Batería amarilla
        this.barras.fillStyle(0xffff00);
        this.barras.fillRect(barX, barY, bateriaPorcentaje * barWidth, barHeight);
    }

    morir() {
        // Dron destruido
        console.trace('[Drone] Rastreo de llamada a morir()');

        // Crear explosión en la posición del dron
        const explosion = this.scene.add.sprite(this.x, this.y, 'proyectil_bomba');
        explosion.setScale(1.5);
        explosion.setTint(0xff6600); // Tinta naranja/rojo para explosión
        explosion.setDepth(10000); // Encima de todo

        // Animar la explosión con los frames de fuego
        let frame = 0;
        const explosionTimer = this.scene.time.addEvent({
            delay: 50,
            repeat: 19,
            callback: () => {
                if (frame < 20 && explosion.active) {
                    explosion.setTexture('fire' + String(frame).padStart(2, '0'));
                    frame++;
                } else {
                    if (explosion.active) {
                        explosion.destroy();
                    }
                }
            }
        });

        // Tween de desvanecimiento
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2.0,
            duration: 1000,
            onComplete: () => {
                if (explosion.active) {
                    explosion.destroy();
                }
            }
        });

        // Destruir el dron
        this.destroy();
    }

    mostrarDano(cantidad) {
        // Chequeo de seguridad: asegurar que el sprite aún existe (no destruido)
        if (!this.sprite || !this.sprite.active) {
            console.warn(`[Drone ${this.id}] mostrarDano llamado pero sprite ya fue destruido`);
            return;
        }
        
        // Tinta roja en el dron
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.clearTint();
            }
        });
        
        // Texto de daño flotante
        const damageText = this.scene.add.text(this.x, this.y - 40, `-${cantidad}`, {
            fontSize: '24px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);
        
        // Animatar el texto flotando hacia arriba
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => damageText.destroy()
        });
        
        // Mostrar explosión pequeña para impactos críticos (ejemplo: daño > 20)
        const explosion = this.scene.add.sprite(this.x, this.y, 'fire00')
            .setScale(0.8)
            .setDepth(150)
            .setAlpha(0.7);
        
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => explosion.destroy()
        });
        

    }
}
