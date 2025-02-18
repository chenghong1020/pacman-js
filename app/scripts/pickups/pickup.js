class Pickup {
  constructor(type, scaledTileSize, column, row, pacman, mazeDiv, points) {
    this.type = type;
    this.pacman = pacman;
    this.mazeDiv = mazeDiv;
    this.points = points;
    this.nearPacman = false;

    this.fruitImages = {
      100: 'cherry',
      300: 'strawberry',
      500: 'orange',
      700: 'apple',
      1000: 'melon',
      2000: 'galaxian',
      3000: 'bell',
      5000: 'key',
    };

    this.setStyleMeasurements(type, scaledTileSize, column, row, points);
  }

  /**
   * Resets the pickup's visibility
   */
  reset() {
    this.animationTarget.style.visibility = (this.type === 'fruit')
      ? 'hidden' : 'visible';
  }

  /**
   * Sets various style measurements for the pickup depending on its type
   * @param {('pacdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {number} scaledTileSize
   * @param {number} column
   * @param {number} row
   * @param {number} points
   */
  setStyleMeasurements(type, scaledTileSize, column, row, points) {
    if (type === 'pacdot') {
      this.size = scaledTileSize * 0.25;
      this.x = (column * scaledTileSize) + ((scaledTileSize / 8) * 3);
      this.y = (row * scaledTileSize) + ((scaledTileSize / 8) * 3);
    } else if (type === 'powerPellet') {
      this.size = scaledTileSize;
      this.x = (column * scaledTileSize);
      this.y = (row * scaledTileSize);
    } else {
      this.size = scaledTileSize * 2;
      this.x = (column * scaledTileSize) - (scaledTileSize * 0.5);
      this.y = (row * scaledTileSize) - (scaledTileSize * 0.5);
    }

    this.center = {
      x: column * scaledTileSize,
      y: row * scaledTileSize,
    };

    this.animationTarget = document.createElement('div');
    this.animationTarget.style.position = 'absolute';
    this.animationTarget.style.backgroundSize = `${this.size}px`;
    this.animationTarget.style.backgroundImage = this.determineImage(
      type, points,
    );
    this.animationTarget.style.height = `${this.size}px`;
    this.animationTarget.style.width = `${this.size}px`;
    this.animationTarget.style.top = `${this.y}px`;
    this.animationTarget.style.left = `${this.x}px`;
    this.mazeDiv.appendChild(this.animationTarget);

    if (type === 'powerPellet') {
      this.animationTarget.classList.add('power-pellet');
    }

    this.reset();
  }

  /**
   * Determines the Pickup image based on type and point value
   * @param {('pacdot'|'powerPellet'|'fruit')} type - The classification of pickup
   * @param {Number} points
   * @returns {String}
   */
  determineImage(type, points) {
    let image = '';

    if (type === 'fruit') {
      image = this.fruitImages[points] || 'cherry';
    } else {
      image = type;
    }

    return `url(app/style/graphics/spriteSheets/pickups/${image}.svg)`;
  }

  /**
   * Shows a bonus fruit, resetting its point value and image
   * @param {number} points
   */
  showFruit(points) {
    this.points = points;
    this.animationTarget.style.backgroundImage = this.determineImage(
      this.type, points,
    );
    this.animationTarget.style.visibility = 'visible';
  }

  /**
   * Makes the fruit invisible (happens if Pacman was too slow)
   */
  hideFruit() {
    this.animationTarget.style.visibility = 'hidden';
  }

  /**
   * Returns true if the Pickup is touching a bounding box at Pacman's center
   * @param {({ x: number, y: number, size: number})} pickup
   * @param {({ x: number, y: number, size: number})} originalPacman
   */
  checkForCollision(pickup, originalPacman) {
    const pacman = Object.assign({}, originalPacman);

    pacman.x += (pacman.size * 0.25);
    pacman.y += (pacman.size * 0.25);
    pacman.size /= 2;

    return (pickup.x < pacman.x + pacman.size
      && pickup.x + pickup.size > pacman.x
      && pickup.y < pacman.y + pacman.size
      && pickup.y + pickup.size > pacman.y);
  }

  /**
   * Checks to see if the pickup is close enough to Pacman to be considered for collision detection
   * @param {number} maxDistance - The maximum distance Pacman can travel per cycle
   * @param {({ x:number, y:number })} pacmanCenter - The center of Pacman's hitbox
   * @param {Boolean} debugging - Flag to change the appearance of pickups for testing
   */
  checkPacmanProximity(maxDistance, pacmanCenter, debugging) {
    if (this.animationTarget.style.visibility !== 'hidden') {
      const distance = Math.sqrt(
        ((this.center.x - pacmanCenter.x) ** 2)
        + ((this.center.y - pacmanCenter.y) ** 2),
      );

      this.nearPacman = (distance <= maxDistance);

      if (debugging) {
        this.animationTarget.style.background = this.nearPacman
          ? 'lime' : 'red';
      }
    }
  }

  /**
   * Checks if the pickup is visible and close to Pacman
   * @returns {Boolean}
   */
  shouldCheckForCollision() {
    return this.animationTarget.style.visibility !== 'hidden'
      && this.nearPacman;
  }

  /**
   * If the Pickup is still visible, it checks to see if it is colliding with Pacman.
   * It will turn itself invisible and cease collision-detection after the first
   * collision with Pacman.
   */
  update() {
    if (this.shouldCheckForCollision()) {
      if (this.checkForCollision(
        {
          x: this.x,
          y: this.y,
          size: this.size,
        }, {
          x: this.pacman.position.left,
          y: this.pacman.position.top,
          size: this.pacman.measurement,
        },
      )) {
        this.animationTarget.style.visibility = 'hidden';
        window.dispatchEvent(new CustomEvent('awardPoints', {
          detail: {
            points: this.points,
            type: this.type,
          },
        }));

        if (this.type === 'pacdot') {
          window.dispatchEvent(new Event('dotEaten'));
        } else if (this.type === 'powerPellet') {
          window.dispatchEvent(new Event('dotEaten'));
          window.dispatchEvent(new Event('powerUp'));
        }
      }
    }
  }
}

class Portal extends Pickup {
  constructor(type, scaledTileSize, column, row, pairType, mazeDiv) {
    super(type, scaledTileSize, column, row, null, mazeDiv, 0);
    this.pairType = pairType;
    this.isActive = true;
    this.cooldown = 5000;
    this.lastUsed = 0;
    this.scaledTileSize = scaledTileSize;

    // eslint-disable-next-line max-len
    this.animationTarget.style.backgroundImage = `url(app/style/graphics/spriteSheets/portal/${type}.svg)`;
    this.animationTarget.style.zIndex = 1;
  }

  getPairPosition() {
    const maze = null;
    for (let y = 0; y < maze.length; y += 1) {
      const x = maze[y][0].indexOf(this.pairType);
      if (x !== -1) {
        return {
          x: (x + 0.5) * this.scaledTileSize,
          y: (y + 0.5) * this.scaledTileSize,
        };
      }
    }
    return null;
  }

  update() {
    if (this.shouldCheckForCollision()) {
      const now = Date.now();
      if (this.checkForCollision(
        { x: this.x, y: this.y, size: this.size },
        {
          x: this.gameCoord.pacman.position.left,
          y: this.gameCoord.pacman.position.top,
          size: this.gameCoord.pacman.measurement,
        },
      ) && now - this.lastUsed > this.cooldown) {
        const pairPos = this.getPairPosition();
        if (pairPos) {
          window.dispatchEvent(new CustomEvent('teleport', {
            detail: {
              targetPos: pairPos,
              direction: this.gameCoord.pacman.direction,
              portalType: this.type,
            },
          }));

          this.isActive = false;
          this.lastUsed = now;
          this.animationTarget.style.opacity = '0.5';

          setTimeout(() => {
            this.isActive = true;
            this.animationTarget.style.opacity = '1';
          }, this.cooldown);
        }
      }
    }
  }

  shouldCheckForCollision() {
    return this.isActive && super.shouldCheckForCollision();
  }
}

// removeIf(production)
module.exports = { Pickup, Portal };
// endRemoveIf(production)
