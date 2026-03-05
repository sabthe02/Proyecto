export class InputManager {
    constructor(scene, network) {
        this.scene = scene;
        this.network = network; 

     
        this.keys = scene.input.keyboard.addKeys({
            up: 'W', down: 'S', left: 'A', right: 'D',
            upArrow: 'UP', downArrow: 'DOWN', leftArrow: 'LEFT', rightArrow: 'RIGHT',
            space: 'SPACE'
        });

        this.mouse = scene.input.activePointer;
    }

    update() {
        let vx = 0;
        let vy = 0;

        // Lógica de movimiento 
        if (this.keys.up.isDown || this.keys.upArrow.isDown) vy = -1;
        if (this.keys.down.isDown || this.keys.downArrow.isDown) vy = 1;
        if (this.keys.left.isDown || this.keys.leftArrow.isDown) vx = -1;
        if (this.keys.right.isDown || this.keys.rightArrow.isDown) vx = 1;

        // Solo enviamos datos si hay movimiento o acción
        if (vx !== 0 || vy !== 0) {
            this.procesarMovimiento(vx, vy);
        }

        // Lógica de disparo
        if (Phaser.Input.Keyboard.JustDown(this.keys.space) || this.mouse.isDown) {
            this.procesarDisparo();
        }
    }

    procesarMovimiento(vx, vy) {
        const angulo = Math.atan2(vy, vx) * (180 / Math.PI);

        this.network.send('MOVER', {
            vx: vx,
            vy: vy,
            angulo: angulo
        });
    }

    procesarDisparo() {
        this.network.send('DISPARAR', {
            targetX: this.mouse.worldX,
            targetY: this.mouse.worldY
        });
    }
}