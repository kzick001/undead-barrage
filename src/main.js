class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Game state
        this.isGameOver = false;

        // Core player stats
        this.playerDamage = 4; 
        
        // Toggle for out-of-sync dual cannons
        this.fireLeft = true;

        // Player setup
        this.player = this.add.rectangle(200, 600, 40, 40, 0x00ff00);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.cursors = this.input.keyboard.createCursorKeys();

        // Groups for collision and object management
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Collision logic
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this); // Player collision 

        // Auto-fire timer
        this.time.addEvent({
            delay: 50, 
            callback: this.fireBullet,
            callbackScope: this,
            loop: true
        });

        // Infinite enemy spawn timer
        this.time.addEvent({
            delay: 360, 
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.isGameOver) return; // Stop updates if dead

        // Reset velocity every frame
        this.player.body.setVelocityX(0);

        // Player movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-330);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(330);
        }

        // Cleanup bullets that go off-screen
        this.bullets.children.each(bullet => {
            if (bullet.active && bullet.y < 0) bullet.destroy();
        });
        
        // Cleanup enemies that go off-screen
        this.enemies.children.each(enemy => {
            if (enemy.active && enemy.y > 700) enemy.destroy();
        });
    }

    fireBullet() {
        if (this.isGameOver) return; // Stop shooting if dead

        // Reduced offset to make it look like a single vibrating gun barrel
        const offset = this.fireLeft ? -4 : 4;
        this.fireLeft = !this.fireLeft; // Toggle for next shot

        // Spawn bullet with offset
        const bullet = this.add.rectangle(this.player.x + offset, this.player.y - 20, 4, 10, 0xffff00);
        this.physics.add.existing(bullet);
        this.bullets.add(bullet);
        bullet.body.setVelocityY(-600);
    }

    spawnEnemy() {
        if (this.isGameOver) return; // Stop spawning if dead

        // Spawn randomly across the top width of the canvas
        const randomX = Phaser.Math.Between(20, 380);
        const enemy = this.add.rectangle(randomX, 0, 40, 40, 0xff0000);
        this.physics.add.existing(enemy);
        
        // Enemy stats
        enemy.hp = 10;
        this.enemies.add(enemy);
        enemy.body.setVelocityY(100);
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy(); // Bullet is always destroyed on impact
        enemy.hp -= this.playerDamage;
        
        if (enemy.hp <= 0) {
            enemy.destroy();
        }
    }

    hitPlayer(player, enemy) {
        if (this.isGameOver) return;
        this.isGameOver = true;

        // Freeze everything
        this.physics.pause();
        
        // Visual death feedback
        this.player.setFillStyle(0xff0000); 

        // "You Dead" text 
        this.add.text(200, 300, 'YOU DEAD', { 
            fontSize: '40px', 
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // "Play Again" button setup (initially invisible) 
        const playAgainBtn = this.add.text(200, 400, 'Play Again', { 
            fontSize: '24px', 
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { left: 15, right: 15, top: 10, bottom: 10 }
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        // Click to restart
        playAgainBtn.on('pointerdown', () => {
            this.scene.restart();
        });

        // Fade in the button after 2 seconds
        this.tweens.add({
            targets: playAgainBtn,
            alpha: 1,
            duration: 1000,
            delay: 2000
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 400,
    height: 700,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { 
            debug: false,
            gravity: { y: 0 } 
        }
    },
    scene: [GameScene]
};

new Phaser.Game(config);