export default class Fire extends Phaser.GameObjects.Sprite {
    constructor(scene) {
        super(scene);

        this.hej = '!!!';

        this.scene.physics.world.enable(this);

        this.body.setSize(8, 8);
        this.body.offset.set(12, 12);

        this.on('animationcomplete', () => {
            if (this.anims.currentAnim.key === 'fireExplode') {
                this.setActive(false);
                this.setVisible(false);
            }
        }, this);
    }

    fire(x, y, left) {
        this.setActive(true);
        this.setVisible(true);
        this.body.allowGravity = true;

        this.setPosition(x, y);
        this.body.velocity.x = 400 * (left ? -1 : 1);
        this.play('fireFly');
        this.scene.sound.playAudioSprite('sfx', 'smb_fireball');

    }

    update(time, delta) {
        if (!this.active) {
            return;
        }
        this.scene.physics.world.collide(this, this.scene.groundLayer, () => this.collided());
        this.scene.physics.world.overlap(this, this.scene.enemyGroup, (me, enemy) => {
            me.explode();
            enemy.starKilled();
        });
    }

    collided() {
        if (this.body.velocity.y === 0) {
            this.body.velocity.y = -150;
        }
        if (this.body.velocity.x === 0) {
            this.scene.sound.playAudioSprite('sfx', 'smb_bump');

            this.explode();
        }
    }

    explode() {
        this.body.allowGravity = false;
        this.body.velocity.y = 0;
        this.play('fireExplode');
    }
}
