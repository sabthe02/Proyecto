export class Portadrones extends Phaser.GameObjects.Container {
    constructor(scene, data) {
        super(scene, data.x || data.posicionX, data.y || data.posicionY);
        this.scene = scene;
        this.id = data.id;
        this.clase = data.clase || 'PORTADRON';
        this.tipoEquipo = data.tipoEquipo || data.tipo || '';
        this.estadoActual = data.estado;
        this.vida = data.vida;
        this.jugadorId = data.jugadorId || data.idJugador;
        this.idJugador = this.jugadorId;
        this.nickName = data.nickName;
        this.z = data.z;
        // Vida máxima fija igual al valor del backend (SesionJuego.java, vida=300)
        this.vidaMax = data.vidaMax !== undefined ? data.vidaMax : 300;
        // Rango de visión: del servidor si disponible, sino valor por defecto según equipo (igual que el dron)
        if (data.rangoVision !== undefined) {
            this.rangoVision = data.rangoVision;
        } else if (this.tipoEquipo === 'AEREO') {
            this.rangoVision = 200;
        } else {
            this.rangoVision = 100;
        }
        this.setDepth(200 + (this.z || 0));
        const config = this.obtenerConfiguracion();
        this.sprite = scene.add.sprite(0, 0, config.textura);
        this.sprite.setScale(config.escala);
        this.add(this.sprite);
        this.labelNombre = scene.add.text(0, config.offsetY - 20, `${this.tipoEquipo} [ID:${this.id}]`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontStyle: 'bold',
            backgroundColor: '#00000088'
        }).setOrigin(0.5);
        this.add(this.labelNombre);
        this.labelHangar = scene.add.text(0, 60, `DRONES EN PORTADRONES: 0`, {
            fontSize: '14px',
            fill: config.colorHangar,
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add(this.labelHangar);
        this.barras = scene.add.graphics();
        this.add(this.barras);
        this.configurarEfectos(config);
        scene.add.existing(this);
        // Dibujar barra de vida desde el inicio para que sea visible sin esperar movimiento
        this.dibujarBarras(this.vida || 0);
    }

    obtenerConfiguracion() {
        if (this.tipoEquipo === 'AEREO') {
            return {
                textura: 'portadrones_aereo',
                escala: 0.2,
                offsetY: -15,
                colorHangar: '#00ccff',
                tieneSombra: true
            };
        } else {
            return {
                textura: 'portadrones_naval',
                escala: 0.15,
                offsetY: -10,
                colorHangar: '#00ffaa',
                tieneSombra: false
            };
        }
    }

    configurarEfectos(config) {
        if (config.tieneSombra) {
            this.sombra = this.scene.add.ellipse(10, 10, 100, 50, 0x000000, 0.3);
            this.addAt(this.sombra, 0); 
        }
    }

 
    actualizarDesdeServidor(data) {
        // Sincronizar propiedades desde el servidor
        this.estadoActual = data.estado;
        this.vida = data.vida;
        this.nickName = data.nickName;
        if (data.vidaMax !== undefined) {
            this.vidaMax = data.vidaMax;
        }

        // Actualizar profundidad según altitud
        this.setDepth(200 + (data.z || 0));
        

    //Controlar la animación de movimiento suavemente en lugar de salto instantáneo
        this.scene.tweens.add({
            targets: this,
            x: data.x,
            y: data.y,
            angle: data.angulo,
            duration: 300,
            ease: 'Linear'
        });

        
        // Backend envía listaDrones array - contar solo los no destruidos
        // Solo actualizar si el datos contiene listaDrones (ACTUALIZAR_PARTIDA incremental puede omitirlo)
        if (data.listaDrones !== undefined) {
            let dronesCount = 0;
            for (let i = 0; i < data.listaDrones.length; i++) {
                const estado = data.listaDrones[i].estado;
                if (estado === 'INACTIVO' || estado === 'CARGANDO') {
                    dronesCount++;
                }
            }
            this.dronesEnPortadron = dronesCount;
            this.labelHangar.setText(`DRONES EN PORTADRONES: ${dronesCount}`);
        }
        this.dibujarBarras(data.vida);
    }

    dibujarBarras(vida) {
        this.barras.clear();

        // vidaMax es 300 (fijo desde el backend). Se calcula el porcentaje sobre ese máximo
        // para que la barra muestre la vida correctamente desde el primer update.
        const vidaPorcentaje = this.vidaMax > 0 ? Math.max(0, Math.min(1, vida / this.vidaMax)) : 0;
        
        const ancho = 120;
        const alto = 10;
        const x = -60;
        const y = -65;

        // BARRA DE VIDA 
        this.barras.fillStyle(0xff0000); // Fondo rojo
        this.barras.fillRect(x, y, ancho, alto);
        this.barras.fillStyle(0x00ff00); // Vida verde (proporcional a escala del backend)
        this.barras.fillRect(x, y, vidaPorcentaje * ancho, alto);
    }

    destruir() {
        // Portadrones fuera de combate

        // Crear explosión más grande para el portadrones
        const explosion = this.scene.add.sprite(this.x, this.y, 'proyectil_bomba');
        explosion.setScale(3.0); // Más grande que la explosión de dron
        explosion.setTint(0xff3300); // Rojo/naranja
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

        // Tween de desvanecimiento con más duración
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 4.0,
            duration: 1500,
            onComplete: () => {
                if (explosion.active) {
                    explosion.destroy();
                }
            }
        });

        // Destruir el portadrones
        this.destroy();
    }

    mostrarDano(cantidad) {
        // Safety check: ensure sprite still exists (not destroyed)
        if (!this.sprite || !this.sprite.active) {
            console.warn(`[Portadrones ${this.id}] mostrarDano llamado pero sprite ya fue destruido`);
            return;
        }
        
        // Flash red tint on the sprite (Container doesn't have setTint, sprite does)
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            if (this.sprite && this.sprite.active) {
                this.sprite.clearTint();
            }
        });
        
        // Spawn damage text
        const damageText = this.scene.add.text(this.x, this.y - 60, `-${cantidad}`, {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(200);
        
        // Animate damage text floating up
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 70,
            alpha: 0,
            duration: 1200,
            onComplete: () => damageText.destroy()
        });
        
        // Show explosion effect (larger for portadrones)
        const explosion = this.scene.add.sprite(this.x, this.y, 'fire00')
            .setScale(1.5)
            .setDepth(150)
            .setAlpha(0.8);
        
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3.0,
            duration: 800,
            onComplete: () => explosion.destroy()
        });
        
        // Screen shake effect for large damage
        if (cantidad >= 50) {
            this.scene.cameras.main.shake(300, 0.005);
        }
        
        // Mostrando dano
    }
}