export class GameOver extends Phaser.Scene {

    constructor() {
        super('GameOver');
    }

    init(data) {
        // result puede ser: win, loss, tie, u opponent_left
        this.result = data.result || 'loss';
    }

    preload() {
        if (this.textures.exists('menu_background')) {
            this.textures.remove('menu_background');
        }
        this.load.image('menu_background', 'assets/background.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Fondo similar a Greeting
        this.bg = this.add.image(width / 2, height / 2, 'menu_background');
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

        // Determinar mensaje y color basado en el resultado
        let message, messageColor;
        
        switch(this.result) {
            case 'win':
                message = '¡Ganaste la partida!';
                messageColor = '#00ff00';
                break;
            case 'loss':
                message = '¡Perdiste la partida!';
                messageColor = '#ff4444';
                break;
            case 'tie':
                message = 'Empate';
                messageColor = '#ffaa00';
                break;
            case 'opponent_left':
                message = 'Empate\nTu oponente salió';
                messageColor = '#ffaa00';
                break;
            default:
                message = 'Partida terminada';
                messageColor = '#ffffff';
        }

        const title = this.add.text(width / 2, height / 2 - 50, message, {
            fontSize: '72px',
            fontStyle: 'bold',
            fill: messageColor,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 8
        })
        .setOrigin(0.5)
        .setShadow(0, 0, '#ffffff9a', 30, true, true);

        title.alpha = 0;
        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.tweens.add({
                    targets: title,
                    scale: 1.1,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Botón "Volver" styled like Greeting scene buttons
        const buttonX = width - 120;
        const buttonY = height - 60;

        const backButtonContainer = this.add.dom(buttonX, buttonY).createFromHTML(`
            <button id="volver" style="
                padding: 14px 32px;
                border-radius: 25px;
                border: none;
                background: linear-gradient(90deg, #e1f1f158, #e1f1f19a);
                color: #000;
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.25s ease;
                box-shadow: 0 0 10px rgba(18, 18, 18, 0.83);
            ">Volver</button>
        `);
        backButtonContainer.node.style.pointerEvents = 'auto';

        const backButton = backButtonContainer.node.querySelector('#volver');

        // Efectos hover para el botón
        backButton.addEventListener('mouseenter', () => {
            backButton.style.transform = 'scale(1.08)';
            backButton.style.boxShadow = '0 0 25px rgba(18, 18, 18, 0.83)';
        });

        backButton.addEventListener('mouseleave', () => {
            backButton.style.transform = 'scale(1)';
            backButton.style.boxShadow = '0 0 10px rgba(248, 250, 250, 0.5)';
        });

        backButton.addEventListener('mousedown', () => {
            backButton.style.transform = 'scale(0.96)';
        });

        backButton.addEventListener('mouseup', () => {
            backButton.style.transform = 'scale(1.08)';
        });

        backButton.addEventListener('click', () => {
            this.sound.stopAll();
            this.scene.stop('Game');
            this.scene.start('GameChoice');
        });

        // Animación de entrada del botón
        backButtonContainer.setAlpha(0);
        this.tweens.add({
            targets: backButtonContainer,
            alpha: 1,
            duration: 1000,
            delay: 500,
            ease: 'Power2'
        });
    }
}
