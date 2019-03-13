import Enemy from './Enemy';

export default class Goomba extends Enemy {
    constructor(config) {
        super(config);
        this.body.setVelocity(0, 0).setBounce(0, 0).setCollideWorldBounds(false);
        this.anims.play('goomba');
        this.killAt = 0;
    }

    update(time, delta) {

        if (!this.activated()) {
            return;
        }
        this.scene.physics.world.collide(this, this.scene.groundLayer);
        if (this.killAt !== 0) {
            this.body.setVelocityX(0);
            this.killAt -= delta;
            if (this.killAt < 0) {
                this.kill();
            }
            return;
        }

        this.scene.physics.world.overlap(this, this.scene.mario, this.marioHit);

        if (this.body.velocity.x === 0) {
            this.direction = -this.direction;
            this.body.velocity.x = this.direction;
        }
    }

    marioHit(enemy, mario) {
        if (enemy.verticalHit(enemy, mario)) {

            mario.enemyBounce(enemy);
            enemy.scene.sound.playAudioSprite('sfx', 'smb_stomp');
            enemy.getFlat(enemy, mario);
            enemy.scene.updateScore(80);
        } else {
            enemy.hurtMario(enemy, mario);
        }
    }

    getFlat(enemy, mario) {
        enemy.play('goombaFlat');
        enemy.body.setVelocityX(0);
        enemy.body.acceleration.x = 0;
        enemy.killAt = 500;
    }
}
