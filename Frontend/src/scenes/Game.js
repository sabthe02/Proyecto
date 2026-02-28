export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.playerTeam = data.team || 'NAVAL';
        this.nickname = data.nickname || 'Player';
        this.idPartida = null;
        this.controlMode = 'PORTADRONES';
        this.activeDron = null;
        this.unidadesRemotas = new Map();
        this.visionRange = (this.playerTeam === 'AEREO') ? 250 : 125;
    }

    preload() {
        this.load.path = 'assets/';
        this.load.image('texturaAgua', 'background/background.jpg');
        this.load.image('skin_naval', 'portadrones/portadronNaval.png');
        this.load.image('skin_aereo', 'portadrones/portadronAereo.png');
    }

    create() {
        console.log("Visualizador de Batalla iniciado - Mapa Infinito");

     
        this.fondoAgua = this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'texturaAgua');
        this.fondoAgua.setOrigin(0, 0);
        this.fondoAgua.setDepth(-1);
        this.fondoAgua.setScrollFactor(0); 
        this.fondoAgua.tileScaleX = 3;
        this.fondoAgua.tileScaleY = 3;
        this.fondoAgua.setTint(0x2266cc);

        
        this.misDrones = this.physics.add.group();
        this.proyectiles = this.physics.add.group();
        this.visionCircle = this.add.graphics();
        this.cursors = this.input.keyboard.createCursorKeys();

        
        this.configurarUnidadSegunEquipo();

      
        if (this.unit) {
            this.cameras.main.startFollow(this.unit, true, 0.05, 0.05);
        }

        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.solicitarLanzarDron();
        });

        this.input.on('pointerdown', (pointer) => {
            if (this.controlMode === 'DRON' && this.activeDron) {
                this.crearBalaVisual(pointer);
                this.emitirDisparo();
            }
        });

        this.crearInterfazHUD();
        this.events.on('ACTUALIZAR_PARTIDA', (data) => this.actualizarRealidad(data));

        window.addEventListener('resize', () => {
            if (this.fondoAgua) {
                this.fondoAgua.setSize(window.innerWidth, window.innerHeight);
            }
        });
    }

    configurarUnidadSegunEquipo() {
        if (this.unit) this.unit.destroy();

        const x = window.innerWidth / 2;
        const y = window.innerHeight / 2;
        const skin = (this.playerTeam === 'AEREO') ? 'skin_aereo' : 'skin_naval';
        
        this.unit = this.add.sprite(x, y, skin);
        this.unit.setDisplaySize(180, 80);
        this.visionRange = (this.playerTeam === 'AEREO') ? 250 : 125;

        this.physics.add.existing(this.unit);
        if (this.unit.body) {
            
            this.unit.body.setCollideWorldBounds(false); 
        }
    }

    update() {
        const target = (this.controlMode === 'DRON' && this.activeDron) ? this.activeDron : this.unit;
        if (!target || !target.x) return;

        let moved = false;
        const speed = 2.5;

        
        if (this.cursors.left.isDown) { 
            target.x -= speed; 
            target.angle = 180; 
            moved = true; 
        }
        else if (this.cursors.right.isDown) { 
            target.x += speed; 
            target.angle = 0;   
            moved = true; 
        }

        if (this.cursors.up.isDown) { 
            target.y -= speed; 
            target.angle = -90; 
            moved = true; 
        }
        else if (this.cursors.down.isDown) { 
            target.y += speed; 
            target.angle = 90;  
            moved = true; 
        }

      
        if (this.cursors.up.isDown && this.cursors.right.isDown) target.angle = -45;
        if (this.cursors.up.isDown && this.cursors.left.isDown) target.angle = -135;
        if (this.cursors.down.isDown && this.cursors.right.isDown) target.angle = 45;
        if (this.cursors.down.isDown && this.cursors.left.isDown) target.angle = 135;

        
        if (this.fondoAgua) {
            this.fondoAgua.tilePositionX = this.cameras.main.scrollX / 3;
            this.fondoAgua.tilePositionY = this.cameras.main.scrollY / 3;
            
        
            this.fondoAgua.tilePositionX += 0.5; 
            this.fondoAgua.tilePositionY += 0.5;
        }

        if (moved) {
            this.dibujarVision();
            this.enviarMovimiento(target);
        }
    }

    actualizarRealidad(data) {
        const miUnidadData = data.elementos.find(e => e.id === (this.activeDron?.id || "Principal"));
        this.actualizarHUD(miUnidadData);
        this.idPartida = data.IdPartida;
    }

    crearBalaVisual(pointer) {
        if (!this.activeDron) return;
        const color = (this.playerTeam === 'AEREO') ? 0xffa500 : 0xff0000;
        const bala = this.add.circle(this.activeDron.x, this.activeDron.y, 4, color);
        this.physics.add.existing(bala);
        const diffX = pointer.worldX - this.activeDron.x;
        const diffY = pointer.worldY - this.activeDron.y;
        const angle = Math.atan2(diffY, diffX);
        const speed = 600;
        bala.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.time.delayedCall(1000, () => bala.destroy());
    }

    dibujarVision() {
        if (!this.visionCircle || !this.visionRange) return;
        this.visionCircle.clear();
        this.visionCircle.fillStyle(0xffffff, 0.15);
        const target = (this.controlMode === 'DRON' && this.activeDron) ? this.activeDron : this.unit;
        if (target) this.visionCircle.fillCircle(target.x, target.y, this.visionRange);
    }

    solicitarLanzarDron() { this.enviarAlSocket({ Tipo: "LANZAR_DRON" }); }

    emitirDisparo() {
        this.enviarAlSocket({
            Tipo: "DISPARAR",
            IdDron: (this.activeDron?.id) || "Dron_Local"
        });
    }

    enviarMovimiento(elemento) {
        this.enviarAlSocket({
            Tipo: "MOVER_ELEMENTO",
            idElemento: elemento.id || "Principal",
            PosicionX: Math.floor(elemento.x),
            PosicionY: Math.floor(elemento.y),
            PosicionZ: (this.controlMode === 'DRON') ? 50 : 0,
            Angulo: Math.floor(elemento.angle)
        });
    }

    enviarAlSocket(json) {
        if (window.gameSocket && window.gameSocket.readyState === WebSocket.OPEN) {
            window.gameSocket.send(JSON.stringify(json));
        }
    }

    crearInterfazHUD() {
        const estilo = { font: 'bold 16px Arial', fill: '#00ff00', backgroundColor: '#000000aa' };
        this.txtEquipo = this.add.text(20, 20, `EQUIPO: ${this.playerTeam}`, estilo).setScrollFactor(0);
        this.txtModo = this.add.text(20, 45, `CONTROL: ${this.controlMode}`, estilo).setScrollFactor(0);
        this.txtVida = this.add.text(20, window.innerHeight - 80, "VIDA: ---", { ...estilo, fill: '#ff0000' }).setScrollFactor(0);
        this.txtBateria = this.add.text(20, window.innerHeight - 55, "BATERÍA: ---", { ...estilo, fill: '#ffff00' }).setScrollFactor(0);
        this.txtMunicion = this.add.text(20, window.innerHeight - 30, "MUNICIÓN: ---", { ...estilo, fill: '#00ffff' }).setScrollFactor(0);
        this.txtLatencia = this.add.text(window.innerWidth - 150, 20, "LATENCIA: --ms", { font: '12px Arial', fill: '#aaaaaa' }).setScrollFactor(0);
    }

    actualizarHUD(datosUnidad) {
        if (!datosUnidad) return;
        if (this.txtVida) this.txtVida.setText(`VIDA: ${datosUnidad.vida}`);
        if (this.txtBateria) this.txtBateria.setText(`BATERÍA: ${datosUnidad.bateria}%`);
        if (this.txtMunicion) this.txtMunicion.setText(`MUNICIÓN: ${datosUnidad.municion}`);
        if (this.txtModo) this.txtModo.setText(`CONTROL: ${this.controlMode}`);
    }
}