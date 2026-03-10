export class Projectile extends Phaser.GameObjects.Sprite {
    constructor(scene, data) {
        // Elegir textura según la clase de proyectil
        let texture;
        if (data.clase === 'MISIL') {
            texture = 'proyectil_misil';
        } else {
            texture = 'proyectil_bomba';
        }
        
        super(scene, data.x, data.y, texture);
        
        this.id = data.id;
        this.clase = data.clase;
        
        if (data.targetX) {
            this.targetX = data.targetX;
        } else {
            this.targetX = data.x;
        }
        
        if (data.targetY) {
            this.targetY = data.targetY;
        } else {
            this.targetY = data.y;
        }
        
        this.causedImpact = false; // Rastrear si este proyectil golpeó un dron/portadron
        
        // Añadir a la escena
        scene.add.existing(this);
        
        // Establecer profundidad POR ENCIMA de drones (300) y portadrones (200)
        // para que los proyectiles sean visibles sobre las unidades
        let zInicial;
        if (data.z) {
            zInicial = data.z;
        } else {
            zInicial = 0;
        }
        this.setDepth(400 + zInicial);
        
        // Aplicar rotación según el ángulo
        if (data.angulo !== undefined) {
            this.setRotation(Phaser.Math.DegToRad(data.angulo));
        }
        
        // Escalar según la clase - aumentado para mejor visibilidad
        if (data.clase === 'MISIL') {
            this.setScale(0.3); // Aumentado de 0.15 a 0.3 para mejor visibilidad
        } else if (data.clase === 'BOMBA') {
            this.setScale(0.3); // Aumentado de 0.2 a 0.3 para consistencia
        }
        
        // Solo loguear proyectiles activos (no en 0,0)
        if (data.x !== 0 || data.y !== 0) {
            // Projectile creado
        }
    }
    
    actualizarDesdeServidor(data) {
        // Actualizar posición
        this.x = data.x;
        this.y = data.y;
        
        if (data.targetX) {
            this.targetX = data.targetX;
        } else {
            this.targetX = data.x;
        }
        
        if (data.targetY) {
            this.targetY = data.targetY;
        } else {
            this.targetY = data.y;
        }
        
        // Actualizar profundidad según altitud (mayor z = más al frente visualmente)
        // Mantener por encima de drones (300) y portadrones (200)
        let zActual;
        if (data.z) {
            zActual = data.z;
        } else {
            zActual = 0;
        }
        this.setDepth(400 + zActual);
        
        // Actualizar rotación
        if (data.angulo !== undefined) {
            this.setRotation(Phaser.Math.DegToRad(data.angulo));
        }
        
        // Actualizar escala según altitud (SOLO para bombas que caen)
        // Perspectiva desde arriba: Z alto (arriba) = grande, Z=0 (suelo) = chica
        if (this.clase === 'BOMBA' && data.z !== undefined) {
            const baseScale = 0.2; // Escala base
            const zMax = 1000; // Z máximo esperado del backend
            const scaleFactor = 0.15; // Cuánto varía la escala
            
            const altScale = baseScale + (data.z / zMax) * scaleFactor;
            this.setScale(Math.max(0.2, altScale)); // Mínimo 0.2 para visibilidad
        } else if (this.clase === 'MISIL') {
            // Misiles mantienen escala constante
            this.setScale(0.3);
        }
    }
    
    destruir() {
        console.log(`[Projectile ${this.id}] destruir() - clase:${this.clase}, pos:(${Math.round(this.x)},${Math.round(this.y)})`);
        
        // Mostrar explosión en la posición del proyectil
        const explosion = this.scene.add.sprite(this.x, this.y, 'fire00');
        explosion.setScale(2);
        explosion.setDepth(500);
        explosion.play('explosion');
        explosion.on('animationcomplete', () => explosion.destroy());
        
        this.destroy();
    }
}
