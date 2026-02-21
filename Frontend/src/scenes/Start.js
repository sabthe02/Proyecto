export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
    }

    create() {

        this.dot = this.add.circle(400, 300, 10, 0x0fffff);

        this.loadPosition();

        this.socket = new WebSocket("ws://localhost:8080/ws");

        this.socket.onopen = () => {
            console.log("Connectado a servidor WebSocket");
            this.socket.send("Hola de Phaser");
        };

        this.socket.onmessage = (event) => {
            console.log("Mensaje del servidor:", event.data);
        };

      //Muevo objeto cuando recibo mensaje del backend  
      this.socket.onmessage = (event) => {

        const data = JSON.parse(event.data);

        if (data.tipo === "MOVER") {
            this.dot.x = data.x;
            this.dot.y = data.y;
        }
    };

        // Detecto movimiento del mouse
        this.input.on('pointermove', (pointer) => {

            this.dot.x = pointer.x;
            this.dot.y = pointer.y;

                if (this.socket && this.socket.readyState === WebSocket.OPEN) {

                    const mensaje = {
                         tipo: "MOVER",
                         x: pointer.x,
                         y: pointer.y
                 };

                this.socket.send(JSON.stringify(mensaje));
    }
});

        this.add.text(16, 16, 'Mover punto con el mouse', {
            fontSize: '20px',
            fill: '#ffffff'
        });

        const botonGuardar = this.add.text(650, 20, 'GUARDAR', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#222222',
            padding: { x: 10, y: 5 },
            fontFamily: 'Arial'
        })

            .setInteractive()
            .on('pointerover', () =>
                botonGuardar.setStyle({ fill: '#ffffff' }))
            .on('pointerout', () => botonGuardar.setStyle({ fill: '#00ff00' }))
            .on('pointerdown', async () => {

                try {
                    const response = await fetch("http://localhost:8080/state", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            id: 1,
                            x: this.dot.x,
                            y: this.dot.y
                        })
                    });

                    const data = await response.json();
                    console.log("Guardado al backend:", data);

                } catch (error) {
                    console.error("Error guardando:", error);
                }

            });

        botonGuardar.setOrigin(0.5);
        botonGuardar.x = 700;
        botonGuardar.y = 40;

        const botonCargar = this.add.text(650, 60, 'CARGAR', {
            fontSize: '24px',
            fill: '#00aaff',
            backgroundColor: '#222222',
            padding: { x: 10, y: 5 },
            fontFamily: 'Arial'
        })
            .setInteractive()
            .on('pointerover', () => botonCargar.setStyle({ fill: '#ffffff' }))
            .on('pointerout', () => botonCargar.setStyle({ fill: '#00aaff' }))
            .on('pointerdown', () => {
                this.loadPosition();
            });

        botonCargar.setOrigin(0.5);
        botonCargar.x = 700;
        botonCargar.y = 80;




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

