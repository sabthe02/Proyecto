export class UIManager {
    constructor(scene) {
        this.scene = scene;

        
        this.textStyle = {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        this.crearHUD();
        this.escucharEventos();
    }

    crearHUD() {
        
        this.vidaTexto = this.scene.add.text(20, 20, 'VIDA: 100%', this.textStyle).setScrollFactor(0);
        this.bateriaTexto = this.scene.add.text(20, 50, 'BATERÍA: 100%', this.textStyle).setScrollFactor(0);
        this.coordTexto = this.scene.add.text(20, 80, 'POS: 0, 0', { ...this.textStyle, fontSize: '14px' }).setScrollFactor(0);

      
        this.fondoMinimap = this.scene.add.rectangle(this.scene.scale.width - 110, 110, 200, 200, 0x000000, 0.5)
            .setScrollFactor(0)
            .setStrokeStyle(2, 0xffffff);
    }

    escucharEventos() {
        // Cuando el server mande actualización, la UI reacciona
        this.scene.events.on('net-ACTUALIZAR_PARTIDA', (data) => {
          
            const miId = sessionStorage.getItem('playerId');
            const yo = data.elementos.find(e => e.id == miId);

            if (yo) {
                this.actualizar(yo.vida, yo.bateria, yo.x, yo.y);
            }
        });
    }

    actualizar(vida, bateria, x, y) {
        this.vidaTexto.setText(`VIDA: ${Math.floor(vida)}%`);
        this.bateriaTexto.setText(`BATERÍA: ${Math.floor(bateria)}%`);
        this.coordTexto.setText(`POS: ${Math.round(x)}, ${Math.round(y)}`);

        // Color crítico si queda poca vida
        this.vidaTexto.setFill(vida < 30 ? '#ff0000' : '#ffffff');
    }

    mostrarMensajeMuerte() {
        const screenCenter = this.scene.scale.width / 2;
        this.scene.add.text(screenCenter, 300, 'DRON DESTRUIDO', { fontSize: '64px', fill: '#ff0000' })
            .setOrigin(0.5)
            .setScrollFactor(0);
    }
}