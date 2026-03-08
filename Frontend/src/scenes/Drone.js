export class Dron extends Phaser.GameObjects.Container {
    constructor(scene, datos) {
        
        super(scene, datos.posicionX, datos.posicionY);
        
        this.id = data.id;
        this.tipoEquipo = data.tipoEquipo;
        this.estadoActual = data.estado || 'INACTIVO';
        this.idJugador = data.idJugador || data.jugadorId || null; // Para saber a quién pertenece
        this.jugadorId = this.idJugador; // Alias para compatibilidad
        this.portadronPadreId = data.portadronPadreId; // Si está en un portadrón
        
        // Backend usa escala de game ticks (e.g., 1000 = 100%)
        // Rastreamos el max valor para calcular porcentajes
        this.bateriaMax = null; // Se detecta dinámicamente

        const skin = this.tipoEquipo === 'AEREO' ? 'dron_aereo' : 'dron_naval';
        this.sprite = scene.add.sprite(0, 0, skin);
        // Escalar drones para que no sean tan grandes (similar a portadrones)
        this.sprite.setScale(this.tipoEquipo === 'AEREO' ? 0.3 : 0.25);
        this.add(this.sprite); // Lo metemos al contenedor
        
        // Sistema de capas (depth) - drones por encima de portadrones
        this.setDepth(300 + (data.z || 0));

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
        this.setPosition(data.x, data.y);
        this.setAngle(data.angulo);
        
        // Actualizar ownership si cambia (raro pero posible)
        if (data.idJugador !== undefined || data.jugadorId !== undefined) {
            this.idJugador = data.idJugador || data.jugadorId || this.idJugador;
            this.jugadorId = this.idJugador;
        }
        
        // Actualizar profundidad según altitud
        this.setDepth(300 + (data.z || 0));
        
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
        
        // Drones solo muestran batería (one-hit kill, no vida)
        // IMPORTANTE: Solo dibujar barras para drones ACTIVOS y visibles
        if (this.visible && data.estado === 'ACTIVO') {
            const bateria = data.bateria !== undefined ? data.bateria : 100;
            // Solo loguear si el valor es anómalo (backend bug)
            if (bateria > 100 || bateria < 0) {
                console.warn(`[Dron ${this.id}] Batería anómala del backend: ${bateria}`);
            }
            this.dibujarInterfazInterna(bateria);
        } else {
            // Limpiar barras si el dron no está activo
            this.barras.clear();
        }
    }
    
    aplicarEstadoVisual(estado) {
        // Limpiar efectos previos
        this.sprite.clearTint();
        this.sprite.setAlpha(1.0);
        
        switch(estado) {
            case 'ACTIVO':
                // Tinte verde brillante para indicar que está activo
                this.sprite.setTint(0x88ff88);
                break;
            case 'INACTIVO':
                // Semi-transparente para inactivos
                this.sprite.setAlpha(0.5);
                break;
            case 'CARGANDO':
                // Tinte azulado pulsante
                this.sprite.setTint(0x8888ff);
                this.scene.tweens.add({
                    targets: this.sprite,
                    alpha: { from: 0.5, to: 1.0 },
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                break;
            case 'DESTRUIDO':
                // Será eliminado por EntityManager, no hacer nada
                break;
        }
    }

    dibujarInterfazInterna(bateria) {
        this.barras.clear();
        
        // Backend usa escala de game ticks (e.g., 1000 = 100%)
        // Detectamos el max valor y calculamos porcentaje relativo
        if (this.bateriaMax === null || bateria > this.bateriaMax) {
            this.bateriaMax = bateria;
        }
        
        // Calcular porcentaje basado en la escala del backend
        const bateriaPorcentaje = this.bateriaMax > 0 ? Math.max(0, bateria / this.bateriaMax) : 0;
        
        // Barra ajustada al tamaño del sprite escalado - más visible
        const barWidth = 30;
        const barHeight = 5;
        const barX = -barWidth / 2;
        const barY = -35; // Más arriba para que no se superponga con el sprite
        
        // Fondo gris oscuro con borde
        this.barras.lineStyle(1, 0xffffff, 0.8);
        this.barras.fillStyle(0x222222);
        this.barras.fillRect(barX, barY, barWidth, barHeight);
        this.barras.strokeRect(barX, barY, barWidth, barHeight);
        
        // Batería amarilla (proporcional a escala del backend)
        this.barras.fillStyle(0xffff00);
        this.barras.fillRect(barX, barY, bateriaPorcentaje * barWidth, barHeight);
    }

    morir() {
        console.log(`Dron ${this.id} destruido.`);

        // Crear explosión en la posición del dron
        const explosion = this.scene.add.sprite(this.x, this.y, 'proyectil_bomba');
        explosion.setScale(1.5);
        explosion.setTint(0xff6600); // Tinte naranja/rojo para explosión
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
        // Flash red tint
        this.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
        
        // Spawn damage text
        const damageText = this.scene.add.text(this.x, this.y - 40, `-${cantidad}`, {
            fontSize: '24px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(200);
        
        // Animate damage text floating up
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => damageText.destroy()
        });
        
        // Show explosion particles
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
        
        console.log(`[Drone ${this.id}] Mostrando daño: ${cantidad}`);
    }

    
    morir() {
        console.log(`💥 Dron ${this.id} fuera de combate.`);
        
        // Acá podemos poner animacion de explocion cuando muera el dron.
        // this.scene.add.sprite(this.x, this.y, 'explosion').play('boom');
        
        this.destroy();
    }
}