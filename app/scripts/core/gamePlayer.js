class GamePlayer {
  /**
   * Reference to the GameCoordinator instance.
   * @type {Object}
   */
  constructor(gameCoord) {
    this.gameCoord = gameCoord;
    this.lastTeleportTime = 0; // 全局冷却时间跟踪
    window.addEventListener('teleport', this.handleTeleport.bind(this));
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

  releaseGhost() {
    if (this.gameCoord.idleGhosts.length > 0) {
      const delay = Math.max((8 - (this.gameCoord.level - 1) * 4) * 1000, 0);

      this.gameCoord.endIdleTimer = new Timer(() => {
        this.gameCoord.idleGhosts[0].endIdleMode();
        this.gameCoord.idleGhosts.shift();
      }, delay);
    }
  }

  awardPoints(e) {
    this.gameCoord.points += e.detail.points;
    this.gameCoord.pointsDisplay.innerText = this.gameCoord.points;
    if (this.gameCoord.points > (this.gameCoord.highScore || 0)) {
      this.gameCoord.highScore = this.gameCoord.points;
      this.gameCoord.highScoreDisplay.innerText = this.gameCoord.points;
      localStorage.setItem('highScore', this.gameCoord.highScore);
    }

    if (this.gameCoord.points >= 10000 && !this.gameCoord.extraLifeGiven) {
      this.gameCoord.extraLifeGiven = true;
      this.gameCoord.soundManager.play('extra_life');
      this.gameCoord.lives += 1;
      this.gameCoord.updateExtraLivesDisplay();
    }

    if (e.detail.type === 'fruit') {
      const left = e.detail.points >= 1000
        ? this.gameCoord.scaledTileSize * 12.5
        : this.gameCoord.scaledTileSize * 13;
      const top = this.gameCoord.scaledTileSize * 16.5;
      const width = e.detail.points >= 1000
        ? this.gameCoord.scaledTileSize * 3
        : this.gameCoord.scaledTileSize * 2;
      const height = this.gameCoord.scaledTileSize * 2;

      this.gameCoord
        .displayText({ left, top }, e.detail.points, 2000, width, height);
      this.gameCoord.soundManager.play('fruit');
      this.gameCoord.updateFruitDisplay(
        this.gameCoord.fruit.determineImage('fruit', e.detail.points),
      );
    }
  }

  dotEaten() {
    this.gameCoord.remainingDots -= 1;

    this.gameCoord.soundManager.playDotSound();

    if (this.gameCoord.remainingDots === 174
        || this.gameCoord.remainingDots === 74) {
      this.gameCoord.createFruit();
    }

    if (this.gameCoord.remainingDots === 40
        || this.gameCoord.remainingDots === 20) {
      this.gameCoord.speedUpBlinky();
    }

    if (this.gameCoord.remainingDots === 0) {
      this.gameCoord.advanceLevel();
    }
  }

  createFruit() {
    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.fruitTimer } });
    this.gameCoord
      .fruit.showFruit(this.gameCoord.fruitPoints[this.gameCoord.level]
        || 5000);
    this.gameCoord.fruitTimer = new Timer(() => {
      this.gameCoord.fruit.hideFruit();
    }, 10000);
  }

  flashGhosts(flashes, maxFlashes) {
    if (flashes === maxFlashes) {
      this.gameCoord.scaredGhosts.forEach((ghost) => {
        ghost.endScared();
      });
      this.gameCoord.scaredGhosts = [];
      if (this.gameCoord.eyeGhosts === 0) {
        this.gameCoord.soundManager.setAmbience(
          this.gameCoord.determineSiren(this.gameCoord.remainingDots),
        );
      }
    } else if (this.gameCoord.scaredGhosts.length > 0) {
      this.gameCoord.scaredGhosts.forEach((ghost) => {
        ghost.toggleScaredColor();
      });

      this.gameCoord.ghostFlashTimer = new Timer(() => {
        this.flashGhosts(flashes + 1, maxFlashes);
      }, 250);
    }
  }

  powerUp() {
    if (this.gameCoord.remainingDots !== 0) {
      this.gameCoord.soundManager.setAmbience('power_up');
    }

    this.gameCoord
      .removeTimer({ detail: { timer: this.gameCoord.ghostFlashTimer } });

    this.gameCoord.ghostCombo = 0;
    this.gameCoord.scaredGhosts = [];

    this.gameCoord.ghosts.forEach((ghost) => {
      if (ghost.mode !== 'eyes') {
        this.gameCoord.scaredGhosts.push(ghost);
      }
    });

    this.gameCoord.scaredGhosts.forEach((ghost) => {
      ghost.becomeScared();
    });

    const powerDuration = Math.max((7 - this.gameCoord.level) * 1000, 0);
    this.gameCoord.ghostFlashTimer = new Timer(() => {
      this.flashGhosts(0, 9);
    }, powerDuration);
  }

  eatGhost(e) {
    const pauseDuration = 1000;
    const { position, measurement } = e.detail.ghost;

    this.gameCoord
      .pauseTimer({ detail: { timer: this.gameCoord.ghostFlashTimer } });
    this.gameCoord
      .pauseTimer({ detail: { timer: this.gameCoord.ghostCycleTimer } });
    this.gameCoord.pauseTimer({ detail: { timer: this.gameCoord.fruitTimer } });
    this.gameCoord.soundManager.play('eat_ghost');

    this.gameCoord.scaredGhosts = this.gameCoord.scaredGhosts.filter(
      ghost => ghost.name !== e.detail.ghost.name,
    );
    this.gameCoord.eyeGhosts += 1;

    this.gameCoord.ghostCombo += 1;
    const comboPoints = this.gameCoord.determineComboPoints();
    window.dispatchEvent(
      new CustomEvent('awardPoints', {
        detail: {
          points: comboPoints,
        },
      }),
    );
    this.gameCoord
      .displayText(position, comboPoints, pauseDuration, measurement);

    this.gameCoord.allowPacmanMovement = false;
    this.gameCoord.pacman.display = false;
    this.gameCoord.pacman.moving = false;
    e.detail.ghost.display = false;
    e.detail.ghost.moving = false;

    this.gameCoord.ghosts.forEach((ghost) => {
      const ghostRef = ghost;
      ghostRef.animate = false;
      ghostRef.pause(true);
      ghostRef.allowCollision = false;
    });

    new Timer(() => {
      this.gameCoord.soundManager.setAmbience('eyes');

      this.gameCoord
        .resumeTimer({ detail: { timer: this.gameCoord.ghostFlashTimer } });
      this.gameCoord
        .resumeTimer({ detail: { timer: this.gameCoord.ghostCycleTimer } });
      this.gameCoord
        .resumeTimer({ detail: { timer: this.gameCoord.fruitTimer } });
      this.gameCoord.allowPacmanMovement = true;
      this.gameCoord.pacman.display = true;
      this.gameCoord.pacman.moving = true;
      e.detail.ghost.display = true;
      e.detail.ghost.moving = true;
      this.gameCoord.ghosts.forEach((ghost) => {
        const ghostRef = ghost;
        ghostRef.animate = true;
        ghostRef.pause(false);
        ghostRef.allowCollision = true;
      });
    }, pauseDuration);
  }

  restoreGhost() {
    this.gameCoord.eyeGhosts -= 1;

    if (this.gameCoord.eyeGhosts === 0) {
      const sound = this.gameCoord.scaredGhosts.length > 0
        ? 'power_up'
        : this.gameCoord.determineSiren(this.gameCoord.remainingDots);
      this.gameCoord.soundManager.setAmbience(sound);
    }
  }

  handleTeleport(e) {
    const now = Date.now();
    const { source, target } = e.detail;

    // 全局冷却检查（1秒内禁止二次传送）
    if (now - this.lastTeleportTime < 1000) return;

    // 验证Pacman是否在移动中且传送门可用
    if (!this.gameCoord.pacman.moving || !source.isActive) return;

    // 执行传送
    this.executeTeleport(target);

    // 更新全局冷却时间
    this.lastTeleportTime = now;

    // 触发传送门本地冷却
    source.startCooldown();
    this.findPairPortal(source).startCooldown();
  }

  executeTeleport(target) {
    // 暂停Pacman动画防止视觉异常
    this.gameCoord.pacman.animate = false;

    // 添加传送起点粒子效果
    const startEffect = document.createElement('div');
    startEffect.className = 'teleport-effect';
    startEffect.style.left = `${this.gameCoord.pacman.position.left}px`;
    startEffect.style.top = `${this.gameCoord.pacman.position.top}px`;
    this.gameCoord.mazeDiv.appendChild(startEffect);

    // 添加残影效果
    for (let i = 0; i < 3; i += 1) {
      setTimeout(() => {
        const ghost = this.gameCoord.pacman.animationTarget.cloneNode(true);
        ghost.style.position = 'absolute';
        ghost.style.left = `${this.gameCoord.pacman.position.left}px`;
        ghost.style.top = `${this.gameCoord.pacman.position.top}px`;
        ghost.style.animation = 'ghost-fade 0.3s';
        this.gameCoord.mazeDiv.appendChild(ghost);
        setTimeout(() => ghost.remove(), 300);
      }, i * 50);
    }

    // 计算精确的目标位置（网格对齐）
    const newPos = this.calculateAlignedPosition(target);

    // 更新Pacman位置和方向
    this.gameCoord.pacman.position = newPos;
    this.gameCoord.pacman.direction = target.direction;

    // 确保位置更新后立即重绘
    this.gameCoord.pacman.oldPosition = Object.assign({}, newPos);

    // 添加传送终点粒子效果
    const endEffect = document.createElement('div');
    endEffect.className = 'teleport-effect';
    endEffect.style.left = `${newPos.left}px`;
    endEffect.style.top = `${newPos.top}px`;
    this.gameCoord.mazeDiv.appendChild(endEffect);

    // 清理特效元素
    setTimeout(() => {
      startEffect.remove();
      endEffect.remove();
    }, 300);

    // 恢复动画
    setTimeout(() => {
      this.gameCoord.pacman.animate = true;
    }, 50);

    // 播放音效
    this.gameCoord.soundManager.play('teleport');
  }

  calculateAlignedPosition(target) {
    // 根据方向调整对齐方式
    const alignOffset = this.gameCoord.scaledTileSize * 0.5;
    switch (target.direction) {
      case 'left':
        return { left: target.x - alignOffset, top: target.y };
      case 'right':
        return { left: target.x + alignOffset, top: target.y };
      case 'up':
        return { left: target.x, top: target.y - alignOffset };
      case 'down':
        return { left: target.x, top: target.y + alignOffset };
      default:
        return { left: target.x, top: target.y };
    }
  }

  findPairPortal(source) {
    // 在实体列表中查找配对传送门
    // eslint-disable-next-line max-len
    return this.gameCoord.entityList.find(entity => entity instanceof Portal && entity.type === source.pairType);
  }
}

// removeIf(production)
module.exports = GamePlayer;
// endRemoveIf(production)
