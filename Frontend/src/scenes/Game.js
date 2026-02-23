export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        
        this.playerTeam = (data && data.team) ? data.team : 'AEREO';
        this.nickname = (data && data.nickname) ? data.nickname : 'Jugador';
    }

    preload() {
        // Por ahora vacío para evitar errores 
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        if (this.playerTeam === 'AEREO') {
            this.unit = this.add.triangle(400, 300, 0, 40, 40, 40, 20, 0, 0x00ffff);
            this.visionRange = 300;
        } else {
            this.unit = this.add.rectangle(400, 300, 50, 30, 0x0000ff);
            this.visionRange = 150;
        }

    
        this.visionCircle = this.add.graphics();
        this.updateVision();

       
        this.input.on('pointermove', (pointer) => {
            if (this.unit) {
                this.unit.x = pointer.x;
                this.unit.y = pointer.y;
                this.updateVision();
            }
        });

        console.log("Escena Game cargada con éxito para el equipo:", this.playerTeam);
    }

    updateVision() {
        if (!this.visionCircle || !this.unit) return;
        
        this.visionCircle.clear();
        this.visionCircle.fillStyle(0xffffff, 0.2);
        this.visionCircle.fillCircle(this.unit.x, this.unit.y, this.visionRange);
    }

    update() {
       
    }
}