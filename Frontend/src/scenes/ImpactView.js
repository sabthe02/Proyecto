/**
 * ImpactView - Scene de vista lateral para mostrar impactos
 * Se activa cuando el backend envía evento RECIBE_IMPACTO
 * Duración: 3-4 segundos, luego vuelve al juego
 */
export class ImpactView extends Phaser.Scene {
    constructor() {
        super('ImpactView');
    }

    preload() {
        // Cargar sprites laterales de portadrones
        this.load.image('portadrones_aereo_lateral', 'assets/portadrones/PDAreo_lateral.png');
        this.load.image('portadrones_naval_lateral', 'assets/portadrones/PDNaval_lateral.png');
        
        // Cargar sprite de daño para mostrar después del impacto
        this.load.image('damage_overlay', 'assets/daño/playerShip1_damage2.png');
    }

    init(data) {
        // Datos del impacto desde el evento RECIBE_IMPACTO
        this.proyectilTipo = data.proyectilTipo || 'MISIL'; // 'MISIL' o 'BOMBA'
        this.objetivoTipo = data.objetivoTipo || 'DRON'; // 'DRON' o 'PORTADRON'
        this.objetivoEquipo = data.objetivoEquipo || 'AEREO'; // 'AEREO' o 'NAVAL'
        this.dañoInfligido = data.dañoInfligido || 0;
    }

    create() {
        console.log('Mostrando impacto:', this.proyectilTipo, 'vs', this.objetivoTipo, this.objetivoEquipo);
        
        // Fondo oscuro semi-transparente
        this.add.rectangle(
            this.scale.width / 2, 
            this.scale.height / 2, 
            this.scale.width, 
            this.scale.height, 
            0x000000, 
            0.8
        ).setDepth(0);
        
        // Título
        this.add.text(
            this.scale.width / 2, 
            50, 
            '¡IMPACTO!', 
            { 
                fontSize: '64px', 
                fill: '#ff0000',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setDepth(1);
        
        // === PLACEHOLDER: Vista Lateral del Impacto ===
        // Cuando tengas sprites laterales, reemplazá esto con las imágenes reales
        
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        // Fondo de la "escena lateral"
        this.add.rectangle(centerX, centerY, 800, 400, 0x001122, 1)
            .setStrokeStyle(4, 0x00ffff)
            .setDepth(1);
        
        // PROYECTIL (placeholder - reemplazar con sprite lateral)
        this.crearPlaceholderProyectil(centerX - 200, centerY);
        
        // OBJETIVO (placeholder - reemplazar con sprite lateral)
        this.crearPlaceholderObjetivo(centerX + 200, centerY);
        
        // Animación de movimiento del proyectil hacia el objetivo
        this.animarImpacto(centerX - 200, centerY, centerX + 200, centerY);
        
        // Información del impacto
        this.add.text(
            centerX, 
            centerY + 250, 
            `${this.proyectilTipo} → ${this.objetivoTipo} ${this.objetivoEquipo}\nDaño: ${this.dañoInfligido}`, 
            { 
                fontSize: '24px', 
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(1);
        
        // Volver al juego después de 3.5 segundos
        this.time.delayedCall(3500, () => {
            console.log('Volviendo al juego');
            this.scene.resume('Game'); // Reanudar el juego
            this.scene.stop(); // Cerrar esta escena
        });
    }
    
    crearPlaceholderProyectil(x, y) {
        // Usar assets existentes para proyectiles
        const texture = this.proyectilTipo === 'MISIL' ? 'proyectil_misil' : 'proyectil_bomba';
        
        this.proyectilSprite = this.add.sprite(x, y, texture).setDepth(2);
        
        // Rotar para simular vista lateral (90 grados)
        this.proyectilSprite.setAngle(90);
        
        // Escalar apropiadamente
        if (this.proyectilTipo === 'MISIL') {
            this.proyectilSprite.setScale(0.5);
        } else {
            this.proyectilSprite.setScale(0.6);
        }
        
        // Label
        this.add.text(x, y + 60, this.proyectilTipo, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2);
    }
    
    crearPlaceholderObjetivo(x, y) {
        let texture;
        let needsRotation = false;
        let scale = 1.0;
        
        if (this.objetivoTipo === 'DRON') {
            // Drones: usar sprites top-down rotados (todavía no hay laterales)
            texture = this.objetivoEquipo === 'AEREO' ? 'dron_aereo' : 'dron_naval';
            needsRotation = true;
            scale = 2.0; // Drones son pequeños, agrandar
        } else {
            // Portadrones: usar nuevos sprites laterales
            texture = this.objetivoEquipo === 'AEREO' ? 'portadrones_aereo_lateral' : 'portadrones_naval_lateral';
            needsRotation = false;
            scale = 0.8;
        }
        
        this.objetivoSprite = this.add.sprite(x, y, texture).setDepth(2);
        
        // Solo rotar si es necesario (drones, no portadrones)
        if (needsRotation) {
            this.objetivoSprite.setAngle(45);
        }
        
        this.objetivoSprite.setScale(scale);
        
        // Agregar sombra para efecto de profundidad
        const sombra = this.add.sprite(x + 10, y + 10, texture).setDepth(1);
        if (needsRotation) {
            sombra.setAngle(45);
        }
        sombra.setTint(0x000000);
        sombra.setAlpha(0.3);
        sombra.setScale(scale);
        
        // Label
        this.add.text(x, y + 90, `${this.objetivoTipo}\n${this.objetivoEquipo}`, {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(2);
    }
    
    animarImpacto(fromX, fromY, toX, toY) {
        // Animar el proyectil moviéndose hacia el objetivo
        this.tweens.add({
            targets: this.proyectilSprite,
            x: toX,
            y: toY,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                // Efecto de explosión en el impacto
                this.mostrarExplosion(toX, toY);
                
                // Hacer parpadear el objetivo
                this.tweens.add({
                    targets: this.objetivoSprite,
                    alpha: 0,
                    duration: 100,
                    yoyo: true,
                    repeat: 5
                });
            }
        });
    }
    
    mostrarExplosion(x, y) {
        // Efecto de explosión simple (círculo expandiéndose)
        const explosion = this.add.circle(x, y, 10, 0xff0000, 0.8).setDepth(3);
        
        this.tweens.add({
            targets: explosion,
            radius: 100,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => explosion.destroy()
        });
        
        // Partículas de fuego (usa el sprite fire00 ya cargado como 'proyectil_bomba')
        const particles = this.add.particles(x, y, 'proyectil_bomba', {
            speed: { min: 100, max: 300 },
            scale: { start: 0.8, end: 0 },
            lifespan: 600,
            quantity: 20,
            blendMode: 'ADD'
        });
        
        // Destruir el emisor después de la explosión
        this.time.delayedCall(600, () => particles.destroy());
        
        // Mostrar daño visual en el objetivo después de la explosión
        this.time.delayedCall(400, () => {
            if (this.objetivoSprite && this.objetivoSprite.active) {
                const damage = this.add.sprite(
                    this.objetivoSprite.x, 
                    this.objetivoSprite.y, 
                    'damage_overlay'
                ).setDepth(4);
                
                // Igualar la rotación y escala del objetivo
                damage.setAngle(this.objetivoSprite.angle);
                damage.setScale(this.objetivoSprite.scale * 0.8);
                damage.setAlpha(0.7);
            }
        });
    }
}
