import makeAnimations from '../helpers/animations';

class BootScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'BootScene'
        });
    }
    preload() {
        const progress = this.add.graphics();

        this.load.on('complete', () => {
            makeAnimations(this);
            progress.destroy();
            this.scene.start('TitleScene');
        });

        this.load.image('background-clouds', 'assets/images/clouds.png');

        this.load.tilemapTiledJSON('map', 'assets/tilemaps/super-mario.json');

        this.load.spritesheet('tiles', 'assets/images/super-mario.png', {
            frameWidth: 16,
            frameHeight: 16,
            spacing: 2
        });

        this.load.spritesheet('mario', 'assets/images/mario-sprites.png', {
            frameWidth: 16,
            frameHeight: 32
        });

        this.load.atlas('mario-sprites', 'assets/mario-sprites.png', 'assets/mario-sprites.json');

        this.load.audio('gamemusic', [
            'assets/music/gamemusic.ogg',
            'assets/music/gamemusic.mp3'
        ]);

        this.load.audioSprite('sfx', 'assets/audio/sfx.json', [
            'assets/audio/sfx.ogg',
            'assets/audio/sfx.mp3'
        ], {
            instances: 4
        });

        this.load.bitmapFont('font', 'assets/fonts/font.png', 'assets/fonts/font.fnt');

        this.load.json('gameplay', 'assets/json/gameplay.json');
    }
}

export default BootScene;
