export class Portadrones extends Phaser.GameObjects.Container {
    constructor(scene, datos) {
        
        super(scene, datos.posicionX, datos.posicionY);
        
        this.scene = scene;
        this.id = data.id;
        this.clase = 'PORTADRON';
        this.tipoEquipo = data.tipoEquipo;
        
        // Ownership: Quién controla este portadrón (soportar ambos campos)
        this.idJugador = datos.idJugador || datos.jugadorId || null;
        this.jugadorId = this.idJugador; // Alias para compatibilidad
        
        // Backend usa escala de game ticks (e.g., 1000 = 100%)
        // Rastreamos el max valor para calcular porcentajes
        this.vidaMax = null; // Se detecta dinámicamente
        
        // Sistema de capas (depth) - portadrones más abajo que drones
        this.setDepth(200 + (datos.z || 0));

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

        // Gráficos para barras de Vida
        this.barrasUI = scene.add.graphics();
        this.add(this.barrasUI);

        //Efectos
        this.configurarEfectos(config);

        scene.add.existing(this);
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
        // Actualizar ownership si cambia (raro pero posible)
        if (data.idJugador !== undefined || data.jugadorId !== undefined) {
            this.idJugador = data.idJugador || data.jugadorId || this.idJugador;
            this.jugadorId = this.idJugador;
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

        
        // Backend envía listaDrones array - mostrar su tamaño
        let dronesCount = 0;
        if (data.listaDrones) {
            dronesCount = data.listaDrones.length;
        }
        
        this.labelHangar.setText(`DRONES EN PORTADRONES: ${dronesCount}`);
        this.dibujarBarras(data.vida);
    }

    dibujarBarras(vida) {
        this.barras.clear();
        
        // Backend usa escala de game ticks (e.g., 1000 = 100%)
        // Detectamos el max valor y calculamos porcentaje relativo
        if (this.vidaMax === null || vida > this.vidaMax) {
            this.vidaMax = vida;
        }
        
        // Calcular porcentaje basado en la escala del backend
        let vidaPorcentaje = 0;
        if (this.vidaMax > 0) {
            vidaPorcentaje = Math.max(0, vida / this.vidaMax);
        }
        
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
        explosion.setTint(0xff3300); // Rojo/naranja intenso
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