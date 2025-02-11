class GamePlayer {
  /**
   * Reference to the GameCoordinator instance.
   * @type {Object}
   */
  constructor(gameCoord) {
    this.gameCoord = gameCoord;
  }

  deathSequence() {
    this.gameCoord.allowPause = false;
    this.gameCoord.cutscene = true;
    this.gameCoord.soundManager.setCutscene(this.gameCoord.cutscene);
    this.gameCoord.soundManager.stopAmbience();
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.fruitTimer } });
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.ghostCycleTimer } });
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.endIdleTimer } });
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.ghostFlashTimer } });

    this.gameCoord.allowKeyPresses = false;
    this.gameCoord.pacman.moving = false;
    this.gameCoord.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.moving = false;
    });

    new Timer(() => {
      this.gameCoord.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });
      this.gameCoord.pacman.prepDeathAnimation();
      this.gameCoord.soundManager.play('death');

      if (this.gameCoord.lives > 0) {
        this.gameCoord.lives -= 1;

        new Timer(() => {
          this.gameCoord.mazeCover.style.visibility = 'visible';
          new Timer(() => {
            this.gameCoord.allowKeyPresses = true;
            this.gameCoord.mazeCover.style.visibility = 'hidden';
            this.gameCoord.pacman.reset();
            this.gameCoord.ghosts.forEach((ghost) => {
              ghost.reset();
            });
            this.gameCoord.fruit.hideFruit();

            this.gameCoord.startGameplay();
          }, 500);
        }, 2250);
      } else {
        this.gameCoord.gameOver();
      }
    }, 750);
  }

  collisionDetectionLoop() {
    if (this.gameCoord.pacman.position) {
      const maxDistance = this.gameCoord.pacman.velocityPerMs * 750;
      const pacmanCenter = {
        x: this.gameCoord.pacman.position.left + this.gameCoord.scaledTileSize,
        y: this.gameCoord.pacman.position.top + this.gameCoord.scaledTileSize,
      };

      // Set this flag to TRUE to see how two-phase collision detection works!
      const debugging = false;

      this.gameCoord.pickups.forEach((pickup) => {
        pickup.checkPacmanProximity(maxDistance, pacmanCenter, debugging);
      });
    }
  }

  ghostCycle(mode) {
    const delay = mode === 'scatter' ? 7000 : 20000;
    const nextMode = mode === 'scatter' ? 'chase' : 'scatter';

    this.gameCoord.ghostCycleTimer = new Timer(() => {
      this.gameCoord.ghosts.forEach((ghost) => {
        ghost.changeMode(nextMode);
      });

      this.ghostCycle(nextMode);
    }, delay);
  }
}

// removeIf(production)
module.exports = GamePlayer;
// endRemoveIf(production)
