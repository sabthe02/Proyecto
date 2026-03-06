
export class Portadrones extends Phaser.GameObjects.Container {
    constructor(scene, x, y, data) {
        super(scene, x, y);
        this.scene = scene;
        this.id = data.id;
        this.tipoEquipo = data.tipoEquipo;

  
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

        this.labelHangar = scene.add.text(0, 60, `HANGAR: 0`, {
            fontSize: '14px',
            fill: config.colorHangar
        }).setOrigin(0.5);
        this.add(this.labelHangar);

       
        this.barras = scene.add.graphics();
        this.add(this.barras);

      
        this.configurarEfectos(config);


        scene.add.existing(this);
    }

 
    obtenerConfiguracion() {
        if (this.tipoEquipo === 'AEREO') {
            return {
                textura: 'portadrones_aereo',
                escala: 1.8,
                offsetY: -80,
                colorHangar: '#00ccff',
                tieneSombra: true
            };
        } else {
            return {
                textura: 'portadrones_naval',
                escala: 1.5,
                offsetY: -70,
                colorHangar: '#00ffaa',
                tieneSombra: false
            };
        }
    }

    configurarEfectos(config) {
        if (config.tieneSombra) {
            // Si es aéreo, le ponemos una sombra en el suelo para dar sensación de altura
            this.sombra = this.scene.add.ellipse(10, 10, 100, 50, 0x000000, 0.3);
            this.addAt(this.sombra, 0); 
        }
    }

 
    actualizar(data) {
       
        this.scene.tweens.add({
            targets: this,
            x: data.x,
            y: data.y,
            angulp: data.angulo,
            duracion: 100 
        });

        
        this.labelHangar.setText(`HANGAR: ${data.dronesEnHangar || 0}`);
        this.dibujarBarras(data.vida, data.escudo);
    }

    dibujarBarras(vida, escudo) {
        this.barras.clear();
        const ancho = 120;
        const alto = 10;
        const x = -60;
        const y = -65;

       // BARRA DE VIDA 
        this.barras.fillStyle(0xff0000);
        this.barras.fillRect(x, y, ancho, alto);
        this.barras.fillStyle(0x00ff00);
        this.barras.fillRect(x, y, (vida / 100) * ancho, alto);

   
    }

    destruir() {
      
        console.log(`Portadrones ${this.id} fuera de combate.`);
        this.destroy();
    }
}