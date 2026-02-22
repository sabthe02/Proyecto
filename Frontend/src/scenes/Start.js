export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
    }

    create() {
        this.add.text(400, 300, 'Juego iniciado', {
            fontSize: '40px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.dot = this.add.circle(400, 300, 10, 0x0fffff);

        this.input.on('pointermove', (pointer)=> {
            this.dot.x = pointer.x;
            this.dot.y = pointer.y;
        });

        this.add.text(16, 16, 'Juego combate aereo-naval', {
            fontSize: '20px',
            fill: '#ffffff'
        });

        const botonGuardar = this.add.text(650, 20, 'GUARDAR', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#222222',
            padding: {x: 10, y: 5},
            fontFamily: 'Arial'
        })

        .setInteractive()
        .on('pointerover', () => 
           botonGuardar.setStyle({fill: '#ffffff'}))
        .on('pointerout', () => botonGuardar.setStyle({fill: '#00ff00'}))
       ;

        botonGuardar.setOrigin(0.5);
        botonGuardar.x = 700;
        botonGuardar.y = 40;

      this.socket = new WebSocket("ws://localhost:8080/ws");

    this.socket.onopen = () => {
        console.log("Connectado a servidor WebSocket");

    };

    this.socket.onmessage = (event) => {
        console.log("Mensaje del servidor:", event.data);
    };


    this.socket.onerror = (error) => {
        console.error("Error del WebSocket:", error);
    };

    this.socket.onclose = () => {
        console.log("WebSocket cerrado");
    };
        
    }

    

    update() {

    }

    async loadPosition() {

    try {
        const response = await fetch("http://localhost:8080/state/1");
        const data = await response.json();

        if (data) {
            this.dot.x = data.x;
            this.dot.y = data.y;
            console.log("Cargado:", data);
        } else {
            console.log("No se encontró para cargar");
        }

    } catch (error) {
        console.error("Error cargando:", error);
    }
}
}
    
