import { Greeting } from './scenes/Greeting.js';
import { GameChoice } from './scenes/GameChoice.js';
import { LoadGameSelection } from './scenes/LoadGameSelection.js';
import { Lobby } from './scenes/Lobby.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { ImpactView } from './scenes/ImpactView.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [Greeting, GameChoice, LoadGameSelection, Lobby, Game, GameOver, ImpactView],

    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false 
        }
    },

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    dom: {
        createContainer: true
    }
};



const game = new Phaser.Game(config);

window.onload = () => {

  game.scene.stop('Greeting');
  const params = new URLSearchParams(window.location.search);
  const urlScene = params.get('scene');


  const startScene =
    urlScene || localStorage.getItem('lastScene') || 'Greeting';


  game.scene.start(startScene);
};




            