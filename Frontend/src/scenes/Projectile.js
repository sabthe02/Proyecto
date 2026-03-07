export class Projectile extends Phaser.GameObjects.Sprite {
    constructor(scene, data) {
        // Elegir textura según la clase de proyectil
        const texture = data.clase === 'MISIL' ? 'proyectil_misil' : 'proyectil_bomba';
        
        super(scene, data.x, data.y, texture);
        
        this.id = data.id;
        this.clase = data.clase;
        this.targetX = data.targetX || data.x;
        this.targetY = data.targetY || data.y;
        
        // Añadir a la escena
        scene.add.existing(this);
        
        // Establecer profundidad por encima del mapa pero debajo de UI
        this.setDepth(100);
        
        // Aplicar rotación según el ángulo
        if (data.angulo !== undefined) {
            this.setRotation(Phaser.Math.DegToRad(data.angulo));
        }
        
        // Escalar según la clase
        if (data.clase === 'MISIL') {
            this.setScale(0.15);
        } else if (data.clase === 'BOMBA') {
            this.setScale(0.2);
        }
        
        // Solo loguear proyectiles activos (no en 0,0)
        if (data.x !== 0 || data.y !== 0) {
            console.log(`Projectile ${this.id} creado en (${data.x}, ${data.y})`);
        }
    }
    
    actualizarDesdeServidor(data) {
        // Actualizar posición
        this.x = data.x;
        this.y = data.y;
        this.targetX = data.targetX || data.x;
        this.targetY = data.targetY || data.y;
        
        // Actualizar profundidad según altitud (mayor z = más al frente visualmente)
        this.setDepth(100 + (data.z || 0));
        
        // Actualizar rotación
        if (data.angulo !== undefined) {
            this.setRotation(Phaser.Math.DegToRad(data.angulo));
        }
        
        // Actualizar escala según altitud (SOLO para bombas que caen)
        // Perspectiva desde arriba: Z alto (arriba) = grande, Z=0 (suelo) = chica
        if (this.clase === 'BOMBA' && data.z !== undefined) {
            // Fórmula: cuanto mayor es z, más grande se ve
            // Rango sugerido: z de 0 a 1000, escala de 0.1 a 0.3
            const baseScale = 0.2; // Escala base
            const zMax = 1000; // Z máximo esperado del backend
            const scaleFactor = 0.15; // Cuánto varía la escala
            
            const altScale = baseScale + (data.z / zMax) * scaleFactor;
            this.setScale(altScale);
        } else if (this.clase === 'MISIL') {
            // Misiles mantienen escala constante
            this.setScale(0.15);
        }
    }
    
    destruir() {
        console.log(`Projectile ${this.id} destruido`);
        
        // Crear efecto de explosión
        this.scene.add.sprite(this.x, this.y, 'fire00')
            .setScale(2)
            .setDepth(150)
            .play({ key: 'explosion', frameRate: 20, repeat: 0 })
            .once('animationcomplete', function() {
                this.destroy();
            });
        
        this.destroy();
    }
}
