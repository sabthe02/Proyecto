
export class Municion extends Phaser.GameObjects.Sprite {
    constructor(scene, datos) {
        
        super(scene, datos.posicionX, datos.posicionY, '');
        
        this.scene = scene;
        this.id = datos.id;
        this.tipo = datos.tipo; 

        this.configurarVisual(this.tipo);

        scene.add.existing(this);
    }

    configurarVisual(tipo) {
        if (tipo === 'BOMBA') {
            this.setTexture('sprite_bomba');
            this.setScale(0.6);
            // Efecto visual
            this.scene.tweens.add({
                targets: this,
                angle: 360,
                duration: 1000,
                repeat: -1
            });
        } else {

            this.setTexture('sprite_misil');
            this.setScale(0.8);
            this.setAngle(this.angulo || 0);
        }
    }

 
    actualizarDesdeServidor(datos) {
        // Movimiento rápido
        this.scene.tweens.add({
            targets: this,
            x: datos.posicionX || datos.x,
            y: datos.posicionY || datos.y,
            angle: datos.angulo,
            duration: 50 
        });

        if (datos.vida <= 0 || datos.estado === 'DESTRUIDO') {
            this.morir();
        }
    }


    morir() {
        console.log(`Impacto de ${this.tipo} ID: ${this.id}`);
        
        const animExplosion = (this.tipo === 'BOMBA') ? 'explosion_grande' : 'explosion_pequena';
        
        const explosion = this.scene.add.sprite(this.x, this.y, 'explosion_atlas');
        explosion.play(animExplosion);
        explosion.on('animacioncompleta', () => {
            explosion.destroy();
        });

        this.destroy();
    }
}