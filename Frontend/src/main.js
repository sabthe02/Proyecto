import { Greeting } from './scenes/Greeting.js';
import { Start } from './scenes/Start.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [Greeting, Start],   // ✅ ADD Start HERE

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    dom: {
        createContainer: true
    }
};


new Phaser.Game(config);




            