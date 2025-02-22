class GameFlow {
  /**
   * Reference to the GameCoordinator instance.
   * @type {Object}
   */
  constructor(gameCoord) {
    this.gameCoord = gameCoord;
  }

  reset() {
    this.gameCoord.activeTimers = [];
    this.gameCoord.points = 0;
    this.gameCoord.level = 1;
    this.gameCoord.lives = 2;
    this.gameCoord.extraLifeGiven = false;
    this.gameCoord.remainingDots = 0;
    this.gameCoord.allowKeyPresses = true;
    this.gameCoord.allowPacmanMovement = false;
    this.gameCoord.allowPause = false;
    this.gameCoord.cutscene = true;
    this.gameCoord.highScore = localStorage.getItem('highScore');

    if (this.gameCoord.firstGame) {
      setInterval(() => {
        this.gameCoord.collisionDetectionLoop();
      }, 500);

      this.gameCoord.pacman = new Pacman(
        this.gameCoord.scaledTileSize,
        this.gameCoord.mazeArray,
        new CharacterUtil(this.gameCoord.scaledTileSize),
      );
      this.gameCoord.blinky = new Ghost(
        this.gameCoord.scaledTileSize,
        this.gameCoord.mazeArray,
        this.gameCoord.pacman,
        'blinky',
        this.gameCoord.level,
        new CharacterUtil(this.gameCoord.scaledTileSize),
      );
      this.gameCoord.pinky = new Ghost(
        this.gameCoord.scaledTileSize,
        this.gameCoord.mazeArray,
        this.gameCoord.pacman,
        'pinky',
        this.gameCoord.level,
        new CharacterUtil(this.gameCoord.scaledTileSize),
      );
      this.gameCoord.inky = new Ghost(
        this.gameCoord.scaledTileSize,
        this.gameCoord.mazeArray,
        this.gameCoord.pacman,
        'inky',
        this.gameCoord.level,
        new CharacterUtil(this.gameCoord.scaledTileSize),
        this.gameCoord.blinky,
      );
      this.gameCoord.clyde = new Ghost(
        this.gameCoord.scaledTileSize,
        this.gameCoord.mazeArray,
        this.gameCoord.pacman,
        'clyde',
        this.gameCoord.level,
        new CharacterUtil(this.gameCoord.scaledTileSize),
      );
      this.gameCoord.fruit = new Pickup(
        'fruit',
        this.gameCoord.scaledTileSize,
        13.5,
        17,
        this.gameCoord.pacman,
        this.gameCoord.mazeDiv,
        100,
      );
    }

    this.gameCoord.entityList = [
      this.gameCoord.pacman,
      this.gameCoord.blinky,
      this.gameCoord.pinky,
      this.gameCoord.inky,
      this.gameCoord.clyde,
      this.gameCoord.fruit,
    ];

    this.gameCoord.ghosts = [
      this.gameCoord.blinky,
      this.gameCoord.pinky,
      this.gameCoord.inky,
      this.gameCoord.clyde,
    ];

    this.gameCoord.scaredGhosts = [];
    this.gameCoord.eyeGhosts = 0;

    if (this.gameCoord.firstGame) {
      this.gameCoord.drawMaze(this.gameCoord.mazeArray,
        this.gameCoord.entityList);
      this.gameCoord.soundManager = new SoundManager();
      this.gameCoord.setUiDimensions();
    } else {
      this.gameCoord.pacman.reset();
      this.gameCoord.ghosts.forEach((ghost) => {
        ghost.reset(true);
      });
      this.gameCoord.pickups.forEach((pickup) => {
        if (pickup.type !== 'fruit') {
          this.gameCoord.remainingDots += 1;
          pickup.reset();
          this.gameCoord.entityList.push(pickup);
        }
      });
    }

    this.gameCoord.pointsDisplay.innerHTML = '00';
    this.gameCoord.highScoreDisplay.innerHTML = this.gameCoord.highScore
      || '00';
    this.gameCoord.clearDisplay(this.gameCoord.fruitDisplay);

    const volumePreference = parseInt(
      localStorage.getItem('volumePreference') || 1,
      10,
    );
    this.gameCoord.setSoundButtonIcon(volumePreference);
    this.gameCoord.soundManager.setMasterVolume(volumePreference);
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

  gameOver() {
    localStorage.setItem('highScore', this.gameCoord.highScore);

    new Timer(() => {
      this.gameCoord.displayText(
        {
          left: this.gameCoord.scaledTileSize * 9,
          top: this.gameCoord.scaledTileSize * 16.5,
        },
        'game_over',
        4000,
        this.gameCoord.scaledTileSize * 10,
        this.gameCoord.scaledTileSize * 2,
      );
      this.gameCoord.fruit.hideFruit();

      new Timer(() => {
        this.gameCoord.leftCover.style.left = '0';
        this.gameCoord.rightCover.style.right = '0';

        setTimeout(() => {
          this.gameCoord.mainMenu.style.opacity = 1;
          this.gameCoord.gameStartButton.disabled = false;
          this.gameCoord.mainMenu.style.visibility = 'visible';
        }, 1000);
      }, 2500);
    }, 2250);
  }

  advanceLevel() {
    this.gameCoord.allowPause = false;
    this.gameCoord.cutscene = true;
    this.gameCoord.soundManager.setCutscene(this.gameCoord.cutscene);
    this.gameCoord.allowKeyPresses = false;
    this.gameCoord.soundManager.stopAmbience();

    this.gameCoord.entityList.forEach((entity) => {
      const entityRef = entity;
      entityRef.moving = false;
    });

    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.fruitTimer } });
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.ghostCycleTimer } });
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.endIdleTimer } });
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.ghostFlashTimer } });

    const imgBase = 'app/style//graphics/spriteSheets/maze/';

    new Timer(() => {
      this.gameCoord.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.display = false;
      });

      this.gameCoord.mazeImg.src = `${imgBase}maze_white.svg`;
      new Timer(() => {
        this.gameCoord.mazeImg.src = `${imgBase}maze_blue.svg`;
        new Timer(() => {
          this.gameCoord.mazeImg.src = `${imgBase}maze_white.svg`;
          new Timer(() => {
            this.gameCoord.mazeImg.src = `${imgBase}maze_blue.svg`;
            new Timer(() => {
              this.gameCoord.mazeImg.src = `${imgBase}maze_white.svg`;
              new Timer(() => {
                this.gameCoord.mazeImg.src = `${imgBase}maze_blue.svg`;
                new Timer(() => {
                  this.gameCoord.mazeCover.style.visibility = 'visible';
                  new Timer(() => {
                    this.gameCoord.mazeCover.style.visibility = 'hidden';
                    this.gameCoord.level += 1;
                    this.gameCoord.allowKeyPresses = true;
                    this.gameCoord.entityList.forEach((entity) => {
                      const entityRef = entity;
                      if (entityRef.level) {
                        entityRef.level = this.gameCoord.level;
                      }
                      entityRef.reset();
                      if (entityRef instanceof Ghost) {
                        entityRef.resetDefaultSpeed();
                      }
                      if (
                        entityRef instanceof Pickup
                        && entityRef.type !== 'fruit'
                        && !(entityRef instanceof Portal) // 新增：排除 Portal
                      ) {
                        this.gameCoord.remainingDots += 1;
                      }
                    });
                    this.gameCoord.startGameplay();
                  }, 500);
                }, 250);
              }, 250);
            }, 250);
          }, 250);
        }, 250);
      }, 250);
    }, 2000);
  }

  handlePauseKey() {
    if (this.gameCoord.allowPause) {
      this.gameCoord.allowPause = false;

      setTimeout(() => {
        if (!this.gameCoord.cutscene) {
          this.gameCoord.allowPause = true;
        }
      }, 500);

      this.gameCoord.gameEngine
        .changePausedState(this.gameCoord.gameEngine.running);
      this.gameCoord.soundManager.play('pause');

      if (this.gameCoord.gameEngine.started) {
        this.gameCoord.soundManager.resumeAmbience();
        this.gameCoord.gameUi.style.filter = 'unset';
        this.gameCoord.pausedText.style.visibility = 'hidden';
        this.gameCoord.pauseButton.innerHTML = 'pause';
        this.gameCoord.activeTimers.forEach((timer) => {
          timer.resume();
        });
      } else {
        this.gameCoord.soundManager.stopAmbience();
        this.gameCoord.soundManager.setAmbience('pause_beat', true);
        this.gameCoord.gameUi.style.filter = 'blur(5px)';
        this.gameCoord.pausedText.style.visibility = 'visible';
        this.gameCoord.pauseButton.innerHTML = 'play_arrow';
        this.gameCoord.activeTimers.forEach((timer) => {
          timer.pause();
        });
      }
    }
  }

  startGameplay(initialStart) {
    if (initialStart) {
      this.gameCoord.soundManager.play('game_start');
    }

    this.gameCoord.scaredGhosts = [];
    this.gameCoord.eyeGhosts = 0;
    this.gameCoord.allowPacmanMovement = false;

    const left = this.gameCoord.scaledTileSize * 11;
    const top = this.gameCoord.scaledTileSize * 16.5;
    const duration = initialStart ? 4500 : 2000;
    const width = this.gameCoord.scaledTileSize * 6;
    const height = this.gameCoord.scaledTileSize * 2;

    this.gameCoord.displayText({ left, top }, 'ready', duration, width, height);
    this.gameCoord.updateExtraLivesDisplay();

    new Timer(() => {
      this.gameCoord.allowPause = true;
      this.gameCoord.cutscene = false;
      this.gameCoord.soundManager.setCutscene(this.gameCoord.cutscene);
      this.gameCoord.soundManager.setAmbience(
        this.gameCoord.determineSiren(this.gameCoord.remainingDots),
      );

      this.gameCoord.allowPacmanMovement = true;
      this.gameCoord.pacman.moving = true;

      this.gameCoord.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.moving = true;
      });

      this.gameCoord.ghostCycle('scatter');

      this.gameCoord.idleGhosts = [
        this.gameCoord.pinky,
        this.gameCoord.inky,
        this.gameCoord.clyde,
      ];
      this.gameCoord.releaseGhost();
    }, duration);
  }
}

// removeIf(production)
module.exports = GameFlow;
// endRemoveIf(production)
