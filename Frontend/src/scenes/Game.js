export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
<<<<<<< Updated upstream
        
        this.playerTeam = (data && data.team) ? data.team : 'AEREO';
        this.nickname = (data && data.nickname) ? data.nickname : 'Jugador';
=======
        this.playerTeam = data.team || 'NAVAL';
        this.nickname = data.nickname || 'Player';
        this.idPartida = null;
        this.controlMode = 'PORTADRONES';
        this.activeDron = null;
        this.unidadesRemotas = new Map();
        this.visionRange = (this.playerTeam === 'AEREO') ? 250 : 125;
>>>>>>> Stashed changes
    }

    preload() {
        // Por ahora vacío para evitar errores 
    }

    create() {
<<<<<<< Updated upstream
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
       
=======
        console.log("Visualizador de Batalla iniciado");

      
        this.fondoAgua = this.add.tileSprite(0, 0, 10000, 10000, 'texturaAgua');
        this.fondoAgua.setOrigin(0.5); 
        this.fondoAgua.setDepth(-1);
        this.fondoAgua.setScrollFactor(0);
        this.fondoAgua.tileScaleX = 3;
        this.fondoAgua.tileScaleY = 3;
        this.fondoAgua.setTint(0x2266cc);
        
        this.physics.world.setBounds(-5000, -5000, 10000, 10000);
        this.cameras.main.setBounds(-5000, -5000, 10000, 10000);
  
        this.misDrones = this.physics.add.group();
        this.proyectiles = this.physics.add.group();
        this.visionCircle = this.add.graphics();
        this.cursors = this.input.keyboard.createCursorKeys();

      
        this.configurarUnidadSegunEquipo();

       
        if (this.unit) {
            this.cameras.main.startFollow(this.unit, true, 0.1, 0.1);
            this.cameras.main.setDeadzone(200, 200);
        }

       
        this.crearInterfazHUD();
        this.events.on('ACTUALIZAR_PARTIDA', (data) => this.actualizarRealidad(data));

       
        this.input.keyboard.on('keydown-SPACE', () => {
            this.solicitarLanzarDron();
        });

        this.input.on('pointerdown', (pointer) => {
            if (this.controlMode === 'DRON' && this.activeDron) {
                this.crearBalaVisual(pointer);
                this.emitirDisparo();
            }
        });

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
        const speed = 5;

        // Movimiento por teclado
        if (this.cursors.left.isDown) { target.x -= speed; moved = true; }
        else if (this.cursors.right.isDown) { target.x += speed; moved = true; }

        if (this.cursors.up.isDown) { target.y -= speed; moved = true; }
        else if (this.cursors.down.isDown) { target.y += speed; moved = true; }

        // Lógica de Scroll Infinito
        if (this.fondoAgua) {
          
            
            this.fondoAgua.tilePositionX += 0.3;
            this.fondoAgua.tilePositionY += 0.3;
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

    dibujarVision() {
        if (!this.visionCircle || !this.visionRange) return;
        this.visionCircle.clear();
        this.visionCircle.fillStyle(0xffffff, 0.15);
        const target = (this.controlMode === 'DRON' && this.activeDron) ? this.activeDron : this.unit;
        if (target) {
            this.visionCircle.fillCircle(target.x, target.y, this.visionRange);
        }
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
        if (this.txtVida && datosUnidad.vida !== undefined) this.txtVida.setText(`VIDA: ${datosUnidad.vida}`);
        if (this.txtBateria && datosUnidad.bateria !== undefined) this.txtBateria.setText(`BATERÍA: ${datosUnidad.bateria}%`);
        if (this.txtMunicion && datosUnidad.municion !== undefined) this.txtMunicion.setText(`MUNICIÓN: ${datosUnidad.municion}`);
        if (this.txtModo) this.txtModo.setText(`CONTROL: ${this.controlMode}`);
>>>>>>> Stashed changes
    }
}