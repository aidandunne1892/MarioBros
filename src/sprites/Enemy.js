
export default class Enemy extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y - 16, config.key);
        config.scene.physics.world.enable(this);
        config.scene.add.existing(this);
        this.alive = true;

        this.body.setVelocity(0, 0).setBounce(0, 0).setCollideWorldBounds(false);
        this.body.allowGravity = false;
        this.beenSeen = false;

        this.mario = this.scene.mario;

        this.direction = -50;

        this.body.setSize(12, 12);
        this.body.offset.set(10, 12);
    }

    activated() {
        if (!this.alive) {
            if (this.y > 240) {
                this.kill();
            }
            return false;
        }
        if (!this.beenSeen) {
            if (this.x < this.scene.cameras.main.scrollX + this.scene.sys.game.canvas.width + 32) {
                this.beenSeen = true;
                this.body.velocity.x = this.direction;
                this.body.allowGravity = true;
                return true;
            }
            return false;
        }
        return true;
    }

    verticalHit(enemy, mario) {
        if (!mario.alive) {
            return false;
        }
        return mario.body.velocity.y >= 0 && (mario.body.y + mario.body.height) - enemy.body.y < 10;
    }

    hurtMario(enemy, mario) {
        this.scene.mario.hurtBy(enemy);
    }

    starKilled() {
        if (!this.alive) {
            return;
        }
        this.body.velocity.x = 0;
        this.body.velocity.y = -200;
        this.alive = false;
        this.flipY = true;
        this.scene.sound.playAudioSprite('sfx', 'smb_stomp');
        this.scene.updateScore(100);
    }

    kill() {
        this.scene.enemyGroup.remove(this);
        this.destroy();
    }
}
