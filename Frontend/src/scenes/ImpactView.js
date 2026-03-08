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
        
        // Cargar sprites laterales de drones (SVG files)
        this.load.image('dron_aereo_lateral', 'assets/drones/AD_lateral.svg');
        this.load.image('dron_naval_lateral', 'assets/drones/ND_lateral.svg');
        
        // Cargar sprites de proyectiles (ya cargados en Game)
        this.load.image('proyectil_misil', 'assets/effectos/speed.png');
        this.load.image('proyectil_bomba', 'assets/effectos/fire00.png');
        
        // Cargar sprite de daño para mostrar después del impacto
        this.load.image('damage_overlay', 'assets/daño/playerShip1_damage2.png');
    }

    init(data) {
        // Datos del impacto desde el evento RECIBE_IMPACTO
        if (data.proyectilTipo) {
            this.proyectilTipo = data.proyectilTipo;
        } else {
            this.proyectilTipo = 'MISIL';
        }
        
        if (data.objetivoTipo) {
            this.objetivoTipo = data.objetivoTipo;
        } else {
            this.objetivoTipo = 'DRON';
        }
        
        if (data.objetivoEquipo) {
            this.objetivoEquipo = data.objetivoEquipo;
        } else {
            this.objetivoEquipo = 'AEREO';
        }
        
        if (data.dañoInfligido) {
            this.dañoInfligido = data.dañoInfligido;
        } else {
            this.dañoInfligido = 0;
        }
        
        // Determinar ángulo del proyectil
        if (data.angulo !== undefined) {
            this.angulo = data.angulo;
        } else {
            if (this.proyectilTipo === 'BOMBA') {
                this.angulo = 270;
            } else {
                this.angulo = 0;
            }
        }
        
        this.targetPosicion = data.targetPosicion;
        this.proyectilPosicion = data.proyectilPosicion;
        
        console.log('Inicializado con datos:', {
            proyectilTipo: this.proyectilTipo,
            objetivoTipo: this.objetivoTipo,
            objetivoEquipo: this.objetivoEquipo,
            dañoInfligido: this.dañoInfligido,
            angulo: this.angulo
        });
    }

    create() {
        console.log('[ImpactView] create() iniciado - Mostrando vista de impacto:', this.proyectilTipo, 'vs', this.objetivoTipo, this.objetivoEquipo, 'ángulo:', this.angulo);
        
        try {
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
        
        
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        
        // Fondo de la "escena lateral" - más ancho para mostrar trayectoria
        this.add.rectangle(centerX, centerY, 1200, 400, 0x001122, 1)
            .setStrokeStyle(4, 0x00ffff)
            .setDepth(1);
        
        // OBJETIVO - siempre en el centro de la escena
        const objetivoX = centerX;
        const objetivoY = centerY;
        this.crearPlaceholderObjetivo(objetivoX, objetivoY);
        
        // Calculate projectile start position based on angle
        // The projectile should come from off-screen in the direction of the angle
        // Angulo en grados: 0° = derecha, 90° = abajo (Phaser Y-abajo), 180° = izquierda, 270° = arriba (Phaser Y-abajo)
        const distanciaInicial = 600; // Distance off-screen
        const anguloRad = Phaser.Math.DegToRad(this.angulo);
        
        // Calculate start position (opposite direction of the angle)
        // Para un misil que viaja a la derecha (angulo 0°), comenzar a la izquierda: X = blanco - distancia
        // For a bomb traveling down (angle 270° in standard math), start above: Y = target - distance
        // NOTE: In Phaser, Y increases downward, so we ADD sin() to get proper vertical positioning
        const proyectilX = objetivoX - Math.cos(anguloRad) * distanciaInicial;
        const proyectilY = objetivoY + Math.sin(anguloRad) * distanciaInicial;
        
        this.crearPlaceholderProyectil(proyectilX, proyectilY);
        
        // Animación de movimiento del proyectil hacia el objetivo
        this.animarImpacto(proyectilX, proyectilY, objetivoX, objetivoY);
        
        // Información del impacto
        this.add.text(
            centerX, 
            centerY + 250, 
            `${this.proyectilTipo} → ${this.objetivoTipo} ${this.objetivoEquipo}\nDaño: ${this.dañoInfligido} | Ángulo: ${Math.round(this.angulo)}°`, 
            { 
                fontSize: '24px', 
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(1);
        
        } catch (error) {
            console.error('[ImpactView] ERROR en create():', error);
            // Mostrar mensaje de error
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2,
                'Error al mostrar vista de impacto',
                { fontSize: '32px', fill: '#ff0000' }
            ).setOrigin(0.5);
        }
        
        // Auto-retorno después de la animación (3.5 segundos)
        this.time.delayedCall(3500, () => {
            console.log('[ImpactView] Volviendo al juego después de animación');
            this.scene.resume('Game');
            this.scene.stop();
        });
    }
    
    crearPlaceholderProyectil(x, y) {
        // Usar assets existentes para proyectiles
        let texture;
        if (this.proyectilTipo === 'MISIL') {
            texture = 'proyectil_misil';
        } else {
            texture = 'proyectil_bomba';
        }
        
        // Verificar si la textura existe
        if (!this.textures.exists(texture)) {
            console.error(`[ImpactView] ERROR: Textura de proyectil '${texture}' no existe`);
            this.proyectilSprite = this.add.rectangle(x, y, 50, 20, 0xffff00).setDepth(2);
        } else {
            this.proyectilSprite = this.add.sprite(x, y, texture).setDepth(2);
            
            // Rotar según el ángulo de la trayectoria
            // El sprite debe apuntar en la dirección de movimiento
            this.proyectilSprite.setAngle(this.angulo);
            
            // Escalar según la clase - aumentado para mejor visibilidad
            if (this.proyectilTipo === 'MISIL') {
                this.proyectilSprite.setScale(0.5);// Escalado
            } else {
                this.proyectilSprite.setScale(0.6); // Bombas un poco más grandes
            }
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
            // Drones: usar sprites laterales SVG - REDUCIDA para mejor visibilidad
            if (this.objetivoEquipo === 'AEREO') {
                texture = 'dron_aereo_lateral';
            } else {
                texture = 'dron_naval_lateral';
            }
            needsRotation = false; // Ya están en vista lateral
            scale = 0.5; // Escalado
            console.log(' Usando sprite lateral de dron:', texture);
        } else {
            // Portadrones: usar sprites laterales
            if (this.objetivoEquipo === 'AEREO') {
                texture = 'portadrones_aereo_lateral';
            } else {
                texture = 'portadrones_naval_lateral';
            }
            needsRotation = false;
            scale = 0.8;
            console.log('Usando sprite lateral de portadron:', texture);
        }
        
        // Verificar si la textura existe antes de crearla
        if (!this.textures.exists(texture)) {
            console.error(`ERROR: Textura '${texture}' no existe. Sprites disponibles:`, this.textures.list);
            // Usar un rectángulo como fallback
            this.objetivoSprite = this.add.rectangle(x, y, 100, 100, 0xff0000).setDepth(2);
            this.add.text(x, y, '???', {
                fontSize: '32px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(3);
        } else {
            this.objetivoSprite = this.add.sprite(x, y, texture).setDepth(2);
            
            // No necesitamos rotar - todos los sprites ya están en vista lateral
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
        }
        
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
            duration: 2000, // Duración de la animación
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
        
        // Partículas de fuego (usa el sprite fire00 para simular chispas)
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
