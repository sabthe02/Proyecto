export class Drone extends Phaser.GameObjects.Container {
    constructor(scene, data) {
        super(scene, data.x, data.y);
        
        this.id = data.id;
        this.tipoEquipo = data.tipoEquipo;
     

        const skin = this.tipoEquipo === 'AEREO' ? 'dron_aereo' : 'dron_naval';
        this.sprite = scene.add.sprite(0, 0, skin);
        this.add(this.sprite); // Lo metemos al contenedor

    
        this.label = scene.add.text(0, -45, `ID: ${this.id}`, { fontSize: '12px' }).setOrigin(0.5);
        this.add(this.label);

        this.barras = scene.add.graphics();
        this.add(this.barras);

        
        scene.add.existing(this);
    }


    actualizarDesdeServidor(data) {
        this.setPosition(data.x, data.y);
        this.setAngle(data.angulo);
        
        
        this.dibujarInterfazInterna(data.vida, data.bateria);
    }

    dibujarInterfazInterna(vida, bateria) {
        this.barras.clear();
        
        // Dibujar Vida 
        this.barras.fillStyle(0xff0000);
        this.barras.fillRect(-20, -35, 40, 5);
        this.barras.fillStyle(0x00ff00);
        this.barras.fillRect(-20, -35, (vida / 100) * 40, 5);

        // Dibujar Batería 
        this.barras.fillStyle(0xffff00);
        this.barras.fillRect(-20, -28, (bateria / 100) * 40, 3);
    }
}
