export class UIManager {
    constructor(scene) {
        this.scene = scene;

        this.estiloTexto = {
            fontSize: '18px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: 'Arial'
        };

        this.crearHUD();
        this.escucharMensajesServidor();
    }

    crearHUD() {
        this.infoJugador = this.scene.add.text(20, 20, 'CONECTANDO...', this.estiloTexto).setScrollFactor(0);
        
        this.vidaTexto = this.scene.add.text(20, 50, 'VIDA: -', this.estiloTexto).setScrollFactor(0);
        this.bateriaTexto = this.scene.add.text(20, 80, 'BATERÍA: -', this.estiloTexto).setScrollFactor(0);
        this.coordTexto = this.scene.add.text(20, 110, 'POS: 0, 0', { ...this.estiloTexto, fontSize: '14px' }).setScrollFactor(0);

        this.logSistema = this.scene.add.text(20, this.scene.scale.height - 40, 'Esperando inicio..', { fontSize: '14px', fill: '#aaaaaa' }).setScrollFactor(0);

        this.fondoMinimap = this.scene.add.rectangle(this.scene.scale.width - 110, 110, 200, 200, 0x000000, 0.5)
            .setScrollFactor(0)
            .setStrokeStyle(2, 0xffffff);
    }

    escucharMensajesServidor() {
        this.scene.events.on('JUGADOR_INFO', (datos) => {
            this.infoJugador.setText(`${datos.nickname.toUpperCase()} | EQUIPO: ${datos.team || 'S/E'}`);
        });

        this.scene.events.on('ERROR', (paquete) => {
            this.notificarError(paquete.mensaje);
        });

        this.scene.events.on('ACTUALIZAR_PARTIDA', (paquete) => {
            const idActual = this.scene.inputManager.idElementoSeleccionado;
            const miUnidad = paquete.datos.elementos.find(e => e.id === idActual);

            if (miUnidad) {
                this.actualizarHUD(miUnidad);
            }
        });
    }

    actualizarHUD(datos) {
        const x = datos.posicionX || datos.x;
        const y = datos.posicionY || datos.y;

        this.vidaTexto.setText(`VIDA: ${Math.floor(datos.vida)}%`);
        this.coordTexto.setText(`POS: ${Math.round(x)}, ${Math.round(y)}`);

        // Solo mostrar batería si el elemento tiene 
        if (datos.bateria !== undefined) {
            this.bateriaTexto.setVisible(true);
            this.bateriaTexto.setText(`BATERÍA: ${Math.floor(datos.bateria)}%`);
        } else {
            this.bateriaTexto.setVisible(false);
        }

        // Feedback visual de peligro
        this.vidaTexto.setFill(datos.vida < 30 ? '#ff0000' : '#ffffff');
    }

    notificarError(mensaje) {
        console.error("Servidor dice:", mensaje);
        this.logSistema.setText(`SISTEMA: ${mensaje}`).setFill('#ff5555');
        
        this.scene.time.delayedCall(5000, () => {
            this.logSistema.setFill('#aaaaaa');
        });
    }

    mostrarPantallaFinal(mensaje) {
        const { width, height } = this.scene.scale;
        
        const fondo = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8).setScrollFactor(0);
        const texto = this.scene.add.text(width/2, height/2, mensaje, { fontSize: '48px', fill: '#fff', align: 'center' })
            .setOrigin(0.5)
            .setScrollFactor(0);
    }
}