export class PortaDron extends Phaser.GameObjects.Container {
    constructor(scene, datos) {
        
        super(scene, datos.posicionX, datos.posicionY);
        
        this.scene = scene;
        this.id = datos.id;
        this.tipoEquipo = datos.tipo; 

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
            this.sombra = this.scene.add.ellipse(10, 10, 100, 50, 0x000000, 0.3);
            this.addAt(this.sombra, 0); 
        }
    }

  
    actualizarDesdeServidor(datos) {
      
        this.scene.tweens.add({
            targets: this,
            x: datos.posicionX || datos.x,
            y: datos.posicionY || datos.y,
            angle: datos.angulo,
            duration: 100 
        });

        if (datos.listaDrones) {
            this.labelHangar.setText('HANGAR: ${datos.listaDrones.length}');
        }

        this.dibujarBarras(datos.vida);
    }

    dibujarBarras(vida) {
        this.barrasUI.clear();
        const ancho = 120;
        const alto = 10;
        const x = -60;
        const y = -65;

       
        this.barrasUI.fillStyle(0xff0000);
        this.barrasUI.fillRect(x, y, ancho, alto);

       
        const anchoVida = (vida / 100) * ancho;
        this.barrasUI.fillStyle(0x00ff00);
        this.barrasUI.fillRect(x, y, anchoVida, alto);
    }

    morir() {
        console.log(' PortaDron ${this.id} destruido.');

        this.destroy();
    }
}