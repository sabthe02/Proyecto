export class Dron extends Phaser.GameObjects.Container {
    constructor(scene, datos) {
        
        super(scene, datos.posicionX, datos.posicionY);
        
        this.scene = scene;
        this.id = datos.id;
        this.tipo = datos.tipo; 

       
        const textura = (this.tipo === 'AEREO') ? 'dron_volador' : 'dron_acuatico';
        this.sprite = scene.add.sprite(0, 0, textura);
        this.sprite.setScale(0.8);
        this.add(this.sprite);

     
        this.barrasUI = scene.add.graphics();
        this.add(this.barrasUI);

        
        this.labelId = scene.add.text(0, -40, `ID:${this.id}`, { fontSize: '10px', fill: '#fff' }).setOrigin(0.5);
        this.add(this.labelId);

        scene.add.existing(this);
    }


    actualizarDesdeServidor(datos) {
        
        this.scene.tweens.add({
            targets: this,
            x: datos.posicionX || datos.x,
            y: datos.posicionY || datos.y,
            angle: datos.angulo,
            duration: 100 
        });

        this.vida = datos.vida;
        this.bateria = datos.bateria;
        this.estado = datos.estado; 

   
        this.dibujarBarras();

        if (this.estado === 'DESTRUIDO') {
            this.morir();
        }
    }

    dibujarBarras() {
        this.barrasUI.clear();
        const ancho = 40;
        const x = -20;

        //  BARRA DE VIDA
        this.barrasUI.fillStyle(0xff0000); // Fondo rojo
        this.barrasUI.fillRect(x, -30, ancho, 4);
        this.barrasUI.fillStyle(0x00ff00); // Vida actual verde
        this.barrasUI.fillRect(x, -30, (this.vida / 100) * ancho, 4);

        // BARRA DE BATERÍA 
        this.barrasUI.fillStyle(0x444444); 
        this.barrasUI.fillRect(x, -24, ancho, 3);
        this.barrasUI.fillStyle(0xffff00); 
        this.barrasUI.fillRect(x, -24, (this.bateria / 100) * ancho, 3);
    }

    
    morir() {
        console.log(`💥 Dron ${this.id} fuera de combate.`);
        
        // Acá podemos poner animacion de explocion cuando muera el dron.
        // this.scene.add.sprite(this.x, this.y, 'explosion').play('boom');
        
        this.destroy();
    }
}