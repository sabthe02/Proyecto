export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.playerTeam = data.team || 'AEREO';
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
        console.log("Visualizador de Batalla iniciado");

        this.fondoAgua = this.add.tileSprite(0, 0, window.innerWidth, window.innerHeight, 'texturaAgua');
        this.fondoAgua.setOrigin(0, 0);
        this.fondoAgua.setDepth(-1);
        this.fondoAgua.setScrollFactor(0);
        this.fondoAgua.tileScaleX = 2;
        this.fondoAgua.tileScaleY = 2;
        this.fondoAgua.setTint(0x4488ff);

    
        this.misDrones = this.physics.add.group();
        this.proyectiles = this.physics.add.group();
        this.visionCircle = this.add.graphics();
        this.cursors = this.input.keyboard.createCursorKeys();

    
        this.configurarUnidadSegunEquipo();

        this.input.on('pointermove', (pointer) => {
            const target = (this.controlMode === 'DRON' && this.activeDron) ? this.activeDron : this.unit;
            if (target) {
                target.setPosition(pointer.x, pointer.y);
                this.dibujarVision();
                this.enviarMovimiento(target);
            }
        });

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

    // --- MÉTODOS DE RENDERIZADO ---

    configurarUnidadSegunEquipo() {
        if (this.unit) this.unit.destroy();

        if (this.playerTeam === 'AEREO') {
            this.unit = this.add.sprite(window.innerWidth / 2, window.innerHeight / 2, 'skin_aereo');
            this.unit.setDisplaySize(180, 80);
            this.visionRange = 250;

        } else {
           
            this.unit = this.add.sprite(window.innerWidth / 2, window.innerHeight / 2, 'skin_naval');
            this.unit.setDisplaySize(180, 80);
            this.visionRange = 125;

        }

        this.physics.add.existing(this.unit);
        if (this.unit.body) {
            this.unit.body.setCollideWorldBounds(true);
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
        bala.setStrokeStyle(2, 0xffffff);
        this.physics.add.existing(bala);

        const diffX = pointer.x - this.activeDron.x;
        const diffY = pointer.y - this.activeDron.y;
        const speed = 600;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            bala.body.setVelocity(diffX > 0 ? speed : -speed, 0);
        } else {
            bala.body.setVelocity(0, diffY > 0 ? speed : -speed);
        }

        this.time.delayedCall(1000, () => bala.destroy());
    }

    dibujarVision() {
        if (!this.visionCircle || !this.visionRange) return;
        this.visionCircle.clear();
        this.visionCircle.fillStyle(0xffffff, 0.15);
        const target = (this.controlMode === 'DRON' && this.activeDron) ? this.activeDron : this.unit;
        if (target) {
            this.visionCircle.fillCircle(target.x, target.y, this.visionRange);
        }
    }

    solicitarLanzarDron() {
        this.enviarAlSocket({ Tipo: "LANZAR_DRON" });
    }

    emitirDisparo() {
        const mensaje = {
            Tipo: "DISPARAR",
            IdDron: (this.activeDron && this.activeDron.id) ? this.activeDron.id : "Dron_Local"
        };
        this.enviarAlSocket(mensaje);
    }

    enviarMovimiento(elemento) {
        const mensaje = {
            Tipo: "MOVER_ELEMENTO",
            idElemento: elemento.id || "Principal",
            PosicionX: Math.floor(elemento.x),
            PosicionY: Math.floor(elemento.y),
            PosicionZ: (this.controlMode === 'DRON') ? 50 : 0,
            Angulo: Math.floor(elemento.angle)
        };
        this.enviarAlSocket(mensaje);
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
        if (datosUnidad.vida !== undefined) this.txtVida.setText(`VIDA: ${datosUnidad.vida}`);
        if (datosUnidad.bateria !== undefined) this.txtBateria.setText(`BATERÍA: ${datosUnidad.bateria}%`);
        if (datosUnidad.municion !== undefined) this.txtMunicion.setText(`MUNICIÓN: ${datosUnidad.municion}`);
        this.txtModo.setText(`CONTROL: ${this.controlMode}`);
    }

    update() {
        const target = (this.controlMode === 'DRON' && this.activeDron) ? this.activeDron : this.unit;
        if (!target) return;

        let moved = false;
        const speed = 5;

        if (this.cursors.left.isDown) { target.x -= speed; moved = true; }
        else if (this.cursors.right.isDown) { target.x += speed; moved = true; }

        if (this.cursors.up.isDown) { target.y -= speed; moved = true; }
        else if (this.cursors.down.isDown) { target.y += speed; moved = true; }

        if (moved) {
            this.dibujarVision();
            this.enviarMovimiento(target);
        }

        if (this.fondoAgua) {
            this.fondoAgua.tilePositionX += 0.5;
            this.fondoAgua.tilePositionY += 0.5;
        }
    }
}