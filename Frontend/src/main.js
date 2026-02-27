import { Greeting } from './scenes/Greeting.js';
import { GameChoice } from './scenes/GameChoice.js';
import { Start } from './scenes/Start.js';
import { Lobby } from './scenes/Lobby.js';
import { Game } from './scenes/Game.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [ Greeting, GameChoice, Start, Lobby, Game ],

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    dom: {
        createContainer: true
    }
};

<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
const game = new Phaser.Game(config);

const socket = new WebSocket('ws://localhost:8080/ws');
window.gameSocket = socket;

socket.onopen = () => {
    console.log(" Conectado al servidor de batalla");
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (game.scene.keys.Game) {
        game.scene.keys.Game.events.emit('ACTUALIZAR_PARTIDA', data);
    }
};



window.onload = () => {

  game.scene.stop('Greeting');
  const params = new URLSearchParams(window.location.search);
  const urlScene = params.get('scene');


  const startScene =
    urlScene || localStorage.getItem('lastScene') || 'Greeting';


  game.scene.start(startScene);
};




            