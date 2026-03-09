import { NetworkManager } from './NetworkManager.js';

export class Greeting extends Phaser.Scene {

    constructor() {
        super('Greeting');
    }

    preload() {
        if (this.textures.exists('menu_background')) {
            this.textures.remove('menu_background');
        }
        this.load.image('menu_background', 'assets/background.png');
    }

    create() {

        // Fondo
        const width = this.scale.width;
        const height = this.scale.height;

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
                flex-direction:column;
                align-items:center;
                gap:8px;
            ">
                <div style="display:flex;flex-direction:row;align-items:center;gap:15px;">
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
                <div id="error-msg" style="color:#ff6b6b;font-size:14px;height:20px;min-height:20px;text-align:center;"></div>
            </div>
        `);
        formContainer.node.style.pointerEvents = 'auto';

        this.formContainer = formContainer;

        this.nicknameInput = this.formContainer.node.querySelector('#nickname');
        this.nicknameInput.addEventListener('focus', () => {
            this.input.enabled = false;
        });

        this.nicknameInput.addEventListener('blur', () => {
            this.input.enabled = true;
        });

    

        // botones
        const buttonsContainer = this.add.dom(width / 2 + 47, height / 2 + 70).createFromHTML(`
            <div style="display:flex;flex-direction:row;align-items:center;gap:8px;width:260px;">
                <button id="registro" style="
                    flex:1;
                    padding:12px 0px;
                    border-radius:25px;
                    border:none;
                    background:linear-gradient(90deg, #e1f1f158, #e1f1f19a);
                    color:#000;
                    font-size:18px;
                    font-weight:bold;
                    cursor:pointer;
                    transition:all 0.25s ease;
                    box-shadow:0 0 10px rgba(18, 18, 18, 0.83);
                    box-sizing:border-box;
                ">Registro</button>
                <button id="login" style="
                    flex:1;
                    padding:12px 0px;
                    border-radius:25px;
                    border:none;
                    background:linear-gradient(90deg, #e1f1f158, #e1f1f19a);
                    color:#000;
                    font-size:18px;
                    font-weight:bold;
                    cursor:pointer;
                    transition:all 0.25s ease;
                    box-shadow:0 0 10px rgba(18, 18, 18, 0.83);
                    box-sizing:border-box;
                ">Login</button>
            </div>
        `);;;
        buttonsContainer.node.style.pointerEvents = 'auto';

        const registroBtn = buttonsContainer.node.querySelector('#registro');
        const loginBtn = buttonsContainer.node.querySelector('#login');

        const addButtonAnimations = (btn) => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.08)';
                btn.style.boxShadow = '0 0 25px rgba(18, 18, 18, 0.83)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 0 10px rgba(248, 250, 250, 0.5)';
            });
            btn.addEventListener('mousedown', () => {
                btn.style.transform = 'scale(0.96)';
            });
            btn.addEventListener('mouseup', () => {
                btn.style.transform = 'scale(1.08)';
            });
        };

        addButtonAnimations(registroBtn);
        addButtonAnimations(loginBtn);

        this.pendingRegistration = false;
        this.registroBtn = registroBtn;
        this.loginBtn = loginBtn;

        const clearError = () => {
            try {
                if (this.formContainer && this.formContainer.node) {
                    const domErrEl = this.formContainer.node.querySelector('#error-msg');
                    if (domErrEl) domErrEl.textContent = '';
                    const inputEl = this.formContainer.node.querySelector('#nickname');
                    if (inputEl) {
                        inputEl.style.borderColor = '#e1f1f19a';
                        inputEl.style.boxShadow = '';
                    }
                }
            } catch (e) { 
                console.warn('No se pudo limpiar el error DOM:', e);
            }
        };

        registroBtn.addEventListener('click', () => {
            if (this.registroBtn) this.registroBtn.disabled = true;
            if (this.loginBtn) this.loginBtn.disabled = true;
            clearError();
            this.irAGameChoice('REGISTRAR_JUGADOR');
        });

        loginBtn.addEventListener('click', () => {
            if (this.registroBtn) this.registroBtn.disabled = true;
            if (this.loginBtn) this.loginBtn.disabled = true;
            clearError();
            this.irAGameChoice('LOGIN_JUGADOR');
        });

        // Mensaje de error
        this.statusText = this.add.text(20, 20, '', { 
            fontSize: '16px', 
            fill: '#ffffff' 
        }).setScrollFactor(0);


        // Inicializar NetworkManager
        this.network = new NetworkManager(this);
        this.socket = this.network.socket;

        // Listen to events emitted by NetworkManager instead of overwriting socket handlers
        this.events.on('JUGADOR_CREADO', (data) => {
            console.log('Registro exitoso:', data);
            this.pendingRegistration = false;
            if (data.nickname) {
                sessionStorage.setItem('nickname', data.nickname);
            }
            if (data.id) {
                sessionStorage.setItem('playerId', data.id);
            }
            if (this.statusText) {
                this.statusText.setText('Registro OK — entrando');
            }
            this.scene.start('GameChoice');
        });

        this.events.on('LOGIN_EXITOSO', (data) => {
            console.log('Login exitoso:', data);
            this.pendingRegistration = false;
            if (data.nickname) {
                sessionStorage.setItem('nickname', data.nickname);
            }
            if (data.id) {
                sessionStorage.setItem('playerId', data.id);
            }
            if (data.partidaGuardada !== undefined) {
                sessionStorage.setItem('partidaGuardada', data.partidaGuardada.toString());
            }
            if (this.statusText) {
                this.statusText.setText('Login OK — entrando');
            }
            this.scene.start('GameChoice');
        });

        this.events.on('REGISTRO_FALLIDO', (data) => {
            console.error('Registro fallido:', data);
            this.handleError(data.mensaje || 'Registro fallido');
        });

        this.events.on('LOGIN_FALLIDO', (data) => {
            console.error('Login fallido:', data);
            this.handleError(data.mensaje || 'Login fallido');
        });
    }

    handleError(mensaje) {
        this.pendingRegistration = false;
        
        try {
            if (this.formContainer && this.formContainer.node) {
                const domErr = this.formContainer.node.querySelector('#error-msg');
                if (domErr) {
                    domErr.textContent = mensaje;
                }
                const inputEl = this.formContainer.node.querySelector('#nickname');
                if (inputEl) {
                    inputEl.style.borderColor = '#ff6b6b';
                    inputEl.style.boxShadow = '0 0 6px rgba(255,107,107,0.6)';
                }
            }
        } catch (e) { 
            console.warn('No se pudo establecer el mensaje de error DOM:', e); 
        }

        if (this.statusText) {
            this.statusText.setText('Error: ' + mensaje);
        }

        if (this.registroBtn) {
            this.registroBtn.disabled = false;
        }
        if (this.loginBtn) {
            this.loginBtn.disabled = false;
        }
    }

     update() {
         this.bg.x += 0.1;
    }

    irAGameChoice(tipo = 'REGISTRAR_JUGADOR') {
        const nickname = this.nicknameInput.value;

        console.log('irAGameChoice():', tipo, 'nickname=', nickname, 'socketState=', this.socket && this.socket.readyState);

        this.pendingRegistration = true;

        // Usar NetworkManager para enviar mensajes
        const enviado = tipo === 'REGISTRAR_JUGADOR' 
            ? this.network.registrarJugador(nickname, 'NAVAL')
            : this.network.loginJugador(nickname);
        
        if (!enviado && this.socket) {
            console.log('Socket no abierto — enviar al abrir');
            this.socket.addEventListener('open', () => {
                console.log('Socket abrio — enviando mensaje');
                if (tipo === 'REGISTRAR_JUGADOR') {
                    this.network.registrarJugador(nickname, 'NAVAL');
                } else {
                    this.network.loginJugador(nickname);
                }
            }, { once: true });
        }
    }
}