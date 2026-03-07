
export class InputManager {
    constructor(scene, network) {
        this.scene = scene;
        this.network = network; 
        
        this.idElementoSeleccionado = null;

        this.keys = scene.input.keyboard.addKeys({
            arriba: 'W', abajo: 'S', izquierda: 'A', derecha: 'D',
            flechaArriba: 'UP', flechaAbajo: 'DOWN', flechaIzquierda: 'LEFT', flechaDerecha: 'RIGHT',
            espacio: 'SPACE',
            recargar: 'R'
        });

        this.raton = scene.input.activePointer;
    }


    seleccionarElemento(id) {
        this.idElementoSeleccionado = id;
        console.log(`Controlando elemento ID: ${id}`);
    }

    update() {
        if (!this.idElementoSeleccionado) return;

        let vx = 0;
        let vy = 0;

        if (this.keys.arriba.isDown || this.keys.flechaArriba.isDown) vy = -1;
        if (this.keys.abajo.isDown || this.keys.flechaAbajo.isDown) vy = 1;
        if (this.keys.izquierda.isDown || this.keys.flechaIzquierda.isDown) vx = -1;
        if (this.keys.derecha.isDown || this.keys.flechaDerecha.isDown) vx = 1;

        if (vx !== 0 || vy !== 0) {
            this.procesarMovimiento(vx, vy);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.espacio) || this.raton.leftButtonDown()) {
            this.procesarDisparo();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.recargar)) {
            this.procesarRecarga();
        }
    }

    procesarMovimiento(vx, vy) {
        const unidad = this.scene.entities.getUnidad(this.idElementoSeleccionado);
        if (!unidad) return;

        const velocidad = 5; 
        const nuevaX = unidad.x + (vx * velocidad);
        const nuevaY = unidad.y + (vy * velocidad);
        const angulo = Math.floor(Math.atan2(vy, vx) * (180 / Math.PI));

     
        this.network.send('MOVER_ELEMENTO', {
            idElemento: this.idElementoSeleccionado,
            PosicionX: nuevaX,
            PosicionY: nuevaY,
            PosicionZ: 0, 
            Angulo: angulo
        });
    }

    procesarDisparo() {
       
        this.network.send('DISPARAR', {
            IdDron: this.idElementoSeleccionado
        });
    }

    procesarRecarga() {

        this.network.send('RECARGAR', {
            IdDron: this.idElementoSeleccionado
        });
    }
}