export class Drone extends Phaser.GameObjects.Container {
    constructor(scene, data) {
        super(scene, data.x || data.posicionX, data.y || data.posicionY);
        this.id = data.id;
        this.clase = data.clase || 'DRON';
        this.tipoEquipo = data.tipoEquipo || data.tipo || '';
        this.estadoActual = data.estado;
        this.bateria = data.bateria;
        this.municionDisponible = data.municionDisponible;
        this.jugadorId = data.jugadorId || data.idJugador;
        this.nickName = data.nickName;
        this.portadronPadreId = data.portadronPadreId;
        this.z = data.z;
        // Backend no serializa bateriaMax — usar constante MAX_BATERIA = 1000
        this.bateriaMax = data.bateriaMax || 1000;
        let skin = (this.tipoEquipo === 'AEREO') ? 'dron_aereo' : 'dron_naval';
        this.sprite = scene.add.sprite(0, 0, skin);
        let escala = (this.tipoEquipo === 'AEREO') ? 0.3 : 0.25;
        this.sprite.setScale(escala);
        this.add(this.sprite);
        this.setDepth(300 + (this.z || 0));
        this.label = scene.add.text(0, -45, `ID: ${this.id}`, { fontSize: '12px' }).setOrigin(0.5);
        this.add(this.label);
        this.barras = scene.add.graphics();
        this.barras.setDepth(10);
        this.add(this.barras);
        if (this.estadoActual === 'INACTIVO' || this.estadoActual === 'CARGANDO') {
            this.setVisible(false);
        }
        scene.add.existing(this);
    }

    actualizarDesdeServidor(data) {
        // Sincronizar propiedades desde el servidor
        this.estadoActual = data.estado;
        this.bateria = data.bateria;
        this.municionDisponible = data.municionDisponible;
        this.nickName = data.nickName;
        if (data.bateriaMax !== undefined) {
            this.bateriaMax = data.bateriaMax;
        } else if (!this.bateriaMax) {
            this.bateriaMax = 1000;
        }
        // Animar movimiento suavemente en lugar de salto instantaneo
        this.scene.tweens.add({
            targets: this,
            x: data.x,
            y: data.y,
            angle: data.angulo,
            duration: 200,
            ease: 'Linear'
        });
        

        
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

    morir(razon) {
        // Mostrar explosión en la posición actual del dron (sin importar la razón)
        const explosion = this.scene.add.sprite(this.x, this.y, 'fire00');
        explosion.setScale(2);
        explosion.setDepth(10000);
        explosion.play('explosion');
        explosion.on('animationcomplete', () => explosion.destroy());

        if (razon === 'bateria') {
            // Animación de caída/hundimiento por batería agotada
            let deltaAngulo;
            if (this.tipoEquipo === 'AEREO') {
                deltaAngulo = 90; // El dron aéreo cae girando
            } else {
                deltaAngulo = 30; // El dron naval se hunde levemente inclinado
            }
            let deltaY;
            if (this.tipoEquipo === 'AEREO') {
                deltaY = 250; // Cae hacia abajo
            } else {
                deltaY = 80; // Se hunde suavemente
            }
            this.scene.tweens.add({
                targets: this,
                y: this.y + deltaY,
                alpha: 0,
                angle: this.angle + deltaAngulo,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                    this.destroy();
                }
            });
            // Toast de batería agotada (espacio de pantalla)
            if (this.scene.mostrarMensajeError) {
                this.scene.mostrarMensajeError('Dron destruido por batería agotada');
            }
        } else {
            // Animación de explosión por combate
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
            this.destroy();
        }
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

    
    morir() {
        console.log(`💥 Dron ${this.id} fuera de combate.`);
        
        // Acá podemos poner animacion de explocion cuando muera el dron.
        // this.scene.add.sprite(this.x, this.y, 'explosion').play('boom');
        
        this.destroy();
    }
}