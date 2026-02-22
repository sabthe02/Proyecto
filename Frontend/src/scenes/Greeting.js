export class Greeting extends Phaser.Scene {

    constructor() {
        super('Greeting');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
    }

    create() {

        // Fondo
        const width = this.scale.width;
        const height = this.scale.height;

        this.bg = this.add.image(width / 2, height / 2, 'background');
        this.bg.setDisplaySize(width, height);

        this.tweens.add({
            targets: this.bg,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 15000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Titulo

        const title = this.add.text(width / 2, 80,
            'Sistema Web de Simulación de\nCombate Aéreo‑Naval con Drones',
            {
                fontSize: '42px',
                fontStyle: 'bold',
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 6
            }
        )
        .setOrigin(0.5)
        .setShadow(0, 0, '#e1f1f19a', 20, true, true);

        title.alpha = 0;

        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 1500,
            ease: 'Power2'
        });
                                

        // campo de texto

        const formContainer = this.add.dom(width / 2, height / 2).createFromHTML(`
            <div style="
                display:flex;
                flex-direction:row;
                align-items:center;
                gap:15px;
            ">
                <label style="
                    color:white;
                    font-size:20px;
                    font-weight:bold;
                ">
                    Apodo:
                </label>

                <input id="nickname" type="text"
                    style="
                        padding:10px;
                        width:260px;
                        border-radius:12px;
                        border:2px solid #e1f1f19a;
                        background:#ffffff;
                        color:black;
                        font-size:18px;
                        text-shadow: 0 0 8px #e1f1f19a;
                    "
                />
            </div>
        `);
        formContainer.node.style.pointerEvents = 'auto';

        this.nicknameInput = formContainer.node.querySelector('#nickname');
        this.nicknameInput.addEventListener('focus', () => {
            this.input.enabled = false;
        });

        this.nicknameInput.addEventListener('blur', () => {
            this.input.enabled = true;
        });

    

        // boton
        const startButton = this.add.dom(width / 2 + 30, height / 2 + 70, 'button', {
        fontSize: '20px',
        padding: '14px 28px',
        borderRadius: '25px',
        border: 'none',
        background: 'linear-gradient(90deg, #e1f1f158, #e1f1f19a)',
        color: '#000',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: '0 0 10px rgba(18, 18, 18, 0.83)'

        }, 'EMPEZAR JUEGO');

        const buttonEl = startButton.node;

        buttonEl.addEventListener('mouseenter', () => {
            buttonEl.style.transform = 'scale(1.08)';
            buttonEl.style.boxShadow = '0 0 25px rgba(18, 18, 18, 0.83)';
        });

        buttonEl.addEventListener('mouseleave', () => {
            buttonEl.style.transform = 'scale(1)';
            buttonEl.style.boxShadow = '0 0 10px rgba(248, 250, 250, 0.5)';
        });

        buttonEl.addEventListener('mousedown', () => {
        buttonEl.style.transform = 'scale(0.96)';
        });

        buttonEl.addEventListener('mouseup', () => {
        buttonEl.style.transform = 'scale(1.08)';
        });

        startButton.addListener('click');
        startButton.on('click', () => {
            this.startGame();
        });

        // WebSocket
        this.socket = new WebSocket("ws://localhost:8080/ws");

        this.socket.onopen = () => {
            console.log("WebSocket conectado");
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.tipo === "JUGADOR_REGISTRADO") {
                console.log("Jugador registrado:", data);
                this.scene.start('Start');
            }
        };
    }

     update() {
         this.bg.x += 0.1;
    }

    startGame() {

        const nickname = this.nicknameInput.value;

        const mensaje = {
            tipo: "REGISTRAR_JUGADOR",
            nickname: nickname
        };

        this.socket.send(JSON.stringify(mensaje));
    }
}