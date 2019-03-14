import Mario from '../sprites/Mario';
import Goomba from '../sprites/Goomba';
import Turtle from '../sprites/Turtle';
import PowerUp from '../sprites/PowerUp';
import SMBTileSprite from '../sprites/SMBTileSprite';
import AnimatedTiles from 'phaser-animated-tiles/dist/AnimatedTiles.min.js';
import Fire from '../sprites/Fire';

class GameScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameScene'
        });
    }

    preload() {
        this.load.scenePlugin('animatedTiles', AnimatedTiles, 'animatedTiles', 'animatedTiles');
    }

    create() {
        if (this.registry.get('gameplay')) {
            this.gameplay = {
                recording: this.sys.cache.json.entries.entries.gameplay,
                current: 0,
                time: 0
            };
        } else {
            this.gameplay = null;
        }
        this.destinations = {};

        this.rooms = [];

        this.eightBit = true;

        this.music = this.sound.add('gamemusic');
        this.music.play({
            loop: true
        });

        this.map = this.make.tilemap({
            key: 'map'
        });
        this.tileset = this.map.addTilesetImage('SuperMarioBros-World1-1', 'tiles');

        this.groundLayer = this.map.createDynamicLayer('world', this.tileset, 0, 0);

        this.sys.animatedTiles.init(this.map);

        this.physics.world.bounds.width = this.groundLayer.width;

        this.add.tileSprite(0, 0, this.groundLayer.width, 500, 'background-clouds');

        this.groundLayer.setCollisionByProperty({
            collide: true
        });

        this.enemyGroup = this.add.group();

        this.powerUps = this.add.group();

        this.parseObjectLayers();

        this.keys = {
            jump: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            jump2: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
            fire: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
        };

        this.blockEmitter = this.add.particles('mario-sprites');

        this.blockEmitter.createEmitter({
            frame: {
                frames: ['brick'],
                cycle: true
            },
            gravityY: 1000,
            lifespan: 2000,
            speed: 400,
            angle: {
                min: -90 - 25,
                max: -45 - 25
            },
            frequency: -1
        });

        this.bounceTile = new SMBTileSprite({
            scene: this
        });

        this.createHUD();

        let worldEndAt = -1;
        for (let x = 0; x < this.groundLayer.width; x++) {
            let tile = this.groundLayer.getTileAt(x, 2);
            if (tile && tile.properties.worldsEnd) {
                worldEndAt = tile.pixelX;
                break;
            }
        }
        this.finishLine = {
            x: worldEndAt,
            flag: this.add.sprite(worldEndAt + 8, 4 * 16),
            active: false
        };
        this.finishLine.flag.play('flag');

        let jumpButton = this.add.sprite(350, 180);
        jumpButton.play('button');
        let dpad = this.add.sprite(20, 170);
        dpad.play('dpad');
        this.touchControls = {
            dpad: dpad,
            abutton: jumpButton,
            left: false,
            right: false,
            down: false,
            jump: false,
            visible: false
        };
        jumpButton.setScrollFactor(0, 0);
        jumpButton.alpha = 0;
        jumpButton.setInteractive();
        jumpButton.on('pointerdown', (pointer) => {
            this.touchControls.jump = true;
        });
        jumpButton.on('pointerup', (pointer) => {
            this.touchControls.jump = false;
        });
        dpad.setScrollFactor(0, 0);
        dpad.alpha = 0;
        dpad.setInteractive();
        dpad.on('pointerdown', (pointer) => {
            let x = dpad.x + dpad.width - pointer.x;
            let y = dpad.y + dpad.height - pointer.y;
            console.log(x, y);
            if (y > 0 || Math.abs(x) > -y) {
                if (x > 0) {
                    console.log('going left');
                    this.touchControls.left = true;
                } else {
                    console.log('going right');
                    this.touchControls.right = true;
                }
            } else {
                this.touchControls.down = true;
            }
        });
        dpad.on('pointerup', (pointer) => {
            this.touchControls.left = false;
            this.touchControls.right = false;
            this.touchControls.down = false;
        });
        window.toggleTouch = this.toggleTouch.bind(this);


        if (this.gameplay) {
            this.music.volume = 0;
        }

        this.physics.world.resume();

        this.mario = new Mario({
            scene: this,
            key: 'mario',
            x: 16 * 6,
            y: this.sys.game.config.height - 48 - 48
        });

        this.mario.setRoomBounds(this.rooms);

        this.cameras.main.startFollow(this.mario);

        this.cameras.main.roundPixels = true;

        this.fireballs = this.add.group({
            classType: Fire,
            maxSize: 10,
            runChildUpdate: false 
        });
    }

    update(time, delta) {
        if (!this.gameplay) {
            this.record(delta);
        }

        Array.from(this.fireballs.children.entries).forEach(
            (fireball) => {
                fireball.update(time, delta);
            });

        if (this.gameplay) {
            this.gameplay.time += delta;

            if (this.mario.y > 240 || (this.gameplay.recording.length <= this.gameplay.current + 2) || this.gameplay.current === 14000) {
                this.gameplay.current = 0;
                this.gameplay.time = 0;
                this.mario.x = 16 * 6; 
                this.tick = 0;
                this.registry.set('restartScene', true);

            }

            if (this.gameplay.time >= this.gameplay.recording[this.gameplay.current + 1].time) {
                this.gameplay.current++;
                this.mario.x = this.gameplay.recording[this.gameplay.current].x;
                this.mario.y = this.gameplay.recording[this.gameplay.current].y;
                this.mario.body.setVelocity(this.gameplay.recording[this.gameplay.current].vx, this.gameplay.recording[this.gameplay.current].vy);
            }
            this.keys = {
                jump: {
                    isDown: this.gameplay.recording[this.gameplay.current].keys.jump
                },
                jump2: {
                    isDown: false
                },
                left: {
                    isDown: this.gameplay.recording[this.gameplay.current].keys.left
                },
                right: {
                    isDown: this.gameplay.recording[this.gameplay.current].keys.right
                },
                down: {
                    isDown: this.gameplay.recording[this.gameplay.current].keys.down
                },
                fire: {
                    isDown: this.gameplay.recording[this.gameplay.current].keys.fire
                }
            };
        }

        if (this.physics.world.isPaused) {
            return;
        }

        if (this.mario.x > this.finishLine.x && this.finishLine.active) {
            this.removeFlag();
            this.physics.world.pause();
            return;
        }

        this.levelTimer.time -= delta * 2;
        if (this.levelTimer.time - this.levelTimer.displayedTime * 1000 < 1000) {
            this.levelTimer.displayedTime = Math.round(this.levelTimer.time / 1000);
            this.levelTimer.textObject.setText(('' + this.levelTimer.displayedTime).padStart(3, '0'));
            if (this.levelTimer.displayedTime < 50 && !this.levelTimer.hurry) {
                this.levelTimer.hurry = true;
                this.music.pause();
                let sound = this.sound.addAudioSprite('sfx');
                sound.on('ended', (sound) => {
                    this.music.seek = 0;
                    this.music.rate = 1.5;
                    this.music.resume();
                    sound.destroy();
                });
                sound.play('smb_warning');
            }
            if (this.levelTimer.displayedTime < 1) {
                this.mario.die();
                this.levelTimer.hurry = false;
                this.music.rate = 1;
                this.levelTimer.time = 150 * 1000;
                this.levelTimer.displayedTime = 255;
            }
        }
        this.mario.update(this.keys, time, delta);

        this.enemyGroup.children.entries.forEach(
            (sprite) => {
                sprite.update(time, delta);
            }
        );

        this.powerUps.children.entries.forEach(
            (sprite) => {
                sprite.update(time, delta);
            }
        );
    }

    tileCollision(sprite, tile) {
        if (sprite.type === 'turtle') {
            if (tile.y > Math.round(sprite.y / 16)) {
                return;
            }
        } else if (sprite.type === 'mario') {
            if (sprite.bending && tile.properties.pipe && tile.properties.dest) {
                sprite.enterPipe(tile.properties.dest, tile.rotation);
            }
        }

        if (sprite.type === 'mario' && !sprite.body.blocked.up) {
            return;
        }

        if (tile.properties.callback) {
            switch (tile.properties.callback) {
                case 'questionMark':
                    tile.index = 44;

                    sprite.scene.bounceTile.restart(tile);

                    tile.properties.callback = null;

                    tile.setCollision(true);

                    let powerUp = tile.powerUp ? tile.powerUp : 'coin';

                    (() => new PowerUp({
                        scene: sprite.scene,
                        key: 'sprites16',
                        x: tile.x * 16 + 8,
                        y: tile.y * 16 - 8,
                        type: powerUp
                    }))();
                    
                    sprite.scene.updateScore(75);

                    break;
                case 'breakable':
                    if (sprite.type === 'mario' && sprite.animSuffix === '') {
                        sprite.scene.bounceTile.restart(tile);
                        sprite.scene.sound.playAudioSprite('sfx', 'smb_bump');
                    } else {
                        sprite.scene.updateScore(50);
                        sprite.scene.map.removeTileAt(tile.x, tile.y, true, true, this.groundLayer);
                        sprite.scene.sound.playAudioSprite('sfx', 'smb_breakblock');
                        sprite.scene.blockEmitter.emitParticle(6, tile.x * 16, tile.y * 16);
                    }
                    break;

                default:
                    sprite.scene.sound.playAudioSprite('sfx', 'smb_bump');
                    break;
            }
        } else {
            sprite.scene.sound.playAudioSprite('sfx', 'smb_bump');
        }
    }

    updateScore(score) {
        this.score.pts += score;
        this.score.textObject.setText(('' + this.score.pts).padStart(6, '0'));
    }

    removeFlag(step = 0) {
        switch (step) {
            case 0:
                this.music.pause();
                this.sound.playAudioSprite('sfx', 'smb_flagpole');
                this.mario.play('mario/climb' + this.mario.animSuffix);
                this.mario.x = this.finishLine.x - 1;
                this.tweens.add({
                    targets: this.finishLine.flag,
                    y: 240 - 6 * 8,
                    duration: 1500,
                    onComplete: () => this.removeFlag(1)
                });
                this.tweens.add({
                    targets: this.mario,
                    y: 240 - 3 * 16,
                    duration: 1000,
                    onComplete: () => {
                        this.mario.flipX = true;
                        this.mario.x += 11;
                    }
                });
                break;
            case 1:
                let sound = this.sound.addAudioSprite('sfx');
                sound.on('ended', (sound) => {
                    sound.destroy();
                    this.scene.start('TitleScene');
                });
                sound.play('smb_stage_clear');

                this.mario.play('run' + this.mario.animSuffix);

                this.mario.flipX = false;
                this.tweens.add({
                    targets: this.mario,
                    x: this.finishLine.x + 6 * 16,
                    duration: 1000,
                    onComplete: () => this.removeFlag(2)
                });
                break;
            case 2:
                this.tweens.add({
                    targets: this.mario,
                    alpha: 0,
                    duration: 500
                });
                break;
        }
    }

    toggleTouch() {
        this.touchControls.visible = !this.touchControls.visible;
        if (this.touchControls.visible) {
            this.touchControls.dpad.alpha = 0;
            this.touchControls.abutton.alpha = 0;
        } else {
            this.touchControls.dpad.alpha = 0.5;
            this.touchControls.abutton.alpha = 0.5;
        }
    }

    record(delta) {
        let update = false;
        let keys = {
            jump: this.keys.jump.isDown || this.keys.jump2.isDown,
            left: this.keys.left.isDown,
            right: this.keys.right.isDown,
            down: this.keys.down.isDown,
            fire: this.keys.fire.isDown
        };
        if (typeof (recording) === 'undefined') {
            console.log('DEFINE');
            window.recording = [];
            window.time = 0;
            this.recordedKeys = {};
            update = true;
        } else {
            update = (time - recording[recording.length - 1].time) > 200; 
        }
        time += delta;
        if (!update) {
            ['jump', 'left', 'right', 'down', 'fire'].forEach((dir) => {
                if (keys[dir] !== this.recordedKeys[dir]) {
                    update = true;
                }
            });
        }
        if (update) {
            recording.push({
                time,
                keys,
                x: this.mario.x,
                y: this.mario.y,
                vx: this.mario.body.velocity.x,
                vy: this.mario.body.velocity.y
            });
        }
        this.recordedKeys = keys;
    }

    parseObjectLayers() {
        this.map.getObjectLayer('enemies').objects.forEach(
            (enemy) => {
                let enemyObject;
                switch (this.tileset.tileProperties[enemy.gid - 1].name) {
                    case 'goomba':
                        enemyObject = new Goomba({
                            scene: this,
                            key: 'sprites16',
                            x: enemy.x,
                            y: enemy.y
                        });
                        break;
                    case 'turtle':
                        enemyObject = new Turtle({
                            scene: this,
                            key: 'mario-sprites',
                            x: enemy.x,
                            y: enemy.y
                        });
                        break;
                    default:
                        console.error('Unknown:', this.tileset.tileProperties[enemy.gid - 1]);
                        break;
                }
                this.enemyGroup.add(enemyObject);
            }
        );

        this.map.getObjectLayer('modifiers').objects.forEach((modifier) => {
            let tile, properties, type;

            if (typeof modifier.gid !== 'undefined') {
                properties = this.tileset.tileProperties[modifier.gid - 1];
                type = properties.type;
                if (properties.hasOwnProperty('powerUp')) {
                    type = 'powerUp';
                }
            } else {
                type = modifier.properties.type;
            }

            switch (type) {
                case 'powerUp':
                    tile = this.groundLayer.getTileAt(modifier.x / 16, modifier.y / 16 - 1);
                    tile.powerUp = properties.powerUp;
                    tile.properties.callback = 'questionMark';
                    if (!tile.collides) {
                        tile.setCollision(false, false, false, true);
                    }
                    break;
                case 'room':
                    this.rooms.push({
                        x: modifier.x,
                        width: modifier.width,
                        sky: modifier.properties.sky
                    });
                    break;
            }
        });
    }

    createHUD() {
        const hud = this.add.bitmapText(5 * 8, 8, 'font', 'MARIO                      TIME', 8);
        hud.setScrollFactor(0, 0);
        this.levelTimer = {
            textObject: this.add.bitmapText(36 * 8, 16, 'font', '255', 8),
            time: 150 * 1000,
            displayedTime: 255,
            hurry: false
        };
        this.levelTimer.textObject.setScrollFactor(0, 0);
        this.score = {
            pts: 0,
            textObject: this.add.bitmapText(5 * 8, 16, 'font', '000000', 8)
        };
        this.score.textObject.setScrollFactor(0, 0);

        if (this.gameplay) {
            hud.alpha = 0;
            this.levelTimer.textObject.alpha = 0;
            this.score.textObject.alpha = 0;
        }
    }
    
}

export default GameScene;
