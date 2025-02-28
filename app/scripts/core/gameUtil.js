/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
class GameUtilities {
  /**
   * Reference to the GameCoordinator instance.
   * @type {Object}
   */
  constructor(gameCoord) {
    this.gameCoord = gameCoord;
  }

  /**
   * Load all assets into a hidden Div to pre-load them into memory.
   * There is probably a better way to read all of these file names.
   */
  preloadAssets() {
    return new Promise((resolve) => {
      const loadingContainer = document.getElementById('loading-container');
      const loadingPacman = document.getElementById('loading-pacman');
      const loadingDotMask = document.getElementById('loading-dot-mask');

      const imgBase = 'app/style/graphics/spriteSheets/';
      const imgSources = [
        // Pacman
        `${imgBase}characters/pacman/arrow_down.svg`,
        `${imgBase}characters/pacman/arrow_left.svg`,
        `${imgBase}characters/pacman/arrow_right.svg`,
        `${imgBase}characters/pacman/arrow_up.svg`,
        `${imgBase}characters/pacman/pacman_death.svg`,
        `${imgBase}characters/pacman/pacman_error.svg`,
        `${imgBase}characters/pacman/pacman_down.svg`,
        `${imgBase}characters/pacman/pacman_left.svg`,
        `${imgBase}characters/pacman/pacman_right.svg`,
        `${imgBase}characters/pacman/pacman_up.svg`,

        // Blinky
        `${imgBase}characters/ghosts/blinky/blinky_down_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_down.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_left.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_right.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_angry.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up_annoyed.svg`,
        `${imgBase}characters/ghosts/blinky/blinky_up.svg`,

        // Clyde
        `${imgBase}characters/ghosts/clyde/clyde_down.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_left.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_right.svg`,
        `${imgBase}characters/ghosts/clyde/clyde_up.svg`,

        // Inky
        `${imgBase}characters/ghosts/inky/inky_down.svg`,
        `${imgBase}characters/ghosts/inky/inky_left.svg`,
        `${imgBase}characters/ghosts/inky/inky_right.svg`,
        `${imgBase}characters/ghosts/inky/inky_up.svg`,

        // Pinky
        `${imgBase}characters/ghosts/pinky/pinky_down.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_left.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_right.svg`,
        `${imgBase}characters/ghosts/pinky/pinky_up.svg`,

        // Ghosts Common
        `${imgBase}characters/ghosts/eyes_down.svg`,
        `${imgBase}characters/ghosts/eyes_left.svg`,
        `${imgBase}characters/ghosts/eyes_right.svg`,
        `${imgBase}characters/ghosts/eyes_up.svg`,
        `${imgBase}characters/ghosts/scared_blue.svg`,
        `${imgBase}characters/ghosts/scared_white.svg`,

        // Dots
        `${imgBase}pickups/pacdot.svg`,
        `${imgBase}pickups/powerPellet.svg`,

        // Fruit
        `${imgBase}pickups/apple.svg`,
        `${imgBase}pickups/bell.svg`,
        `${imgBase}pickups/cherry.svg`,
        `${imgBase}pickups/galaxian.svg`,
        `${imgBase}pickups/key.svg`,
        `${imgBase}pickups/melon.svg`,
        `${imgBase}pickups/orange.svg`,
        `${imgBase}pickups/strawberry.svg`,

        // Text
        `${imgBase}text/ready.svg`,

        // Points
        `${imgBase}text/100.svg`,
        `${imgBase}text/200.svg`,
        `${imgBase}text/300.svg`,
        `${imgBase}text/400.svg`,
        `${imgBase}text/500.svg`,
        `${imgBase}text/700.svg`,
        `${imgBase}text/800.svg`,
        `${imgBase}text/1000.svg`,
        `${imgBase}text/1600.svg`,
        `${imgBase}text/2000.svg`,
        `${imgBase}text/3000.svg`,
        `${imgBase}text/5000.svg`,

        // Maze
        `${imgBase}maze/maze_blue.svg`,

        // Misc
        'app/style/graphics/extra_life.svg',
        // Portal
        `${imgBase}pickups/portal.svg`,
      ];

      const audioBase = 'app/style/audio/';
      const audioSources = [
        `${audioBase}game_start.mp3`,
        `${audioBase}pause.mp3`,
        `${audioBase}pause_beat.mp3`,
        `${audioBase}siren_1.mp3`,
        `${audioBase}siren_2.mp3`,
        `${audioBase}siren_3.mp3`,
        `${audioBase}power_up.mp3`,
        `${audioBase}extra_life.mp3`,
        `${audioBase}eyes.mp3`,
        `${audioBase}eat_ghost.mp3`,
        `${audioBase}death.mp3`,
        `${audioBase}fruit.mp3`,
        `${audioBase}dot_1.mp3`,
        `${audioBase}dot_2.mp3`,
        // 添加传送门音效
        `${audioBase}teleport.mp3`,
      ];

      const totalSources = imgSources.length + audioSources.length;
      this.gameCoord.remainingSources = totalSources;

      loadingPacman.style.left = '0';
      loadingDotMask.style.width = '0';

      Promise.all([
        this.gameCoord.createElements(imgSources, 'img', totalSources, this),
        this.gameCoord.createElements(
          audioSources,
          'audio',
          totalSources,
          this,
        ),
      ])
        .then(() => {
          loadingContainer.style.opacity = 0;
          resolve();

          setTimeout(() => {
            loadingContainer.remove();
            this.gameCoord.mainMenu.style.opacity = 1;
            this.gameCoord.mainMenu.style.visibility = 'visible';
          }, 1500);
        })
        .catch(this.gameCoord.displayErrorMessage);
    });
  }

  /**
   * 校验传送门配对是否合法
   * @param {Array} mazeArray - 迷宫数组
   * @returns {boolean} 是否合法
   */
  static validatePortalPairs(mazeArray) {
    let tCount = 0;
    let TCount = 0;

    // 统计传送门数量
    for (const row of mazeArray) {
      for (const cell of row) {
        if (cell === 't') tCount = +1;
        if (cell === 'T') TCount = +1;
      }
    }

    // 检查是否都成对出现
    return tCount === TCount && tCount > 0;
  }

  /**
   * 绘制迷宫和所有实体
   * @param {Array} mazeArray - 迷宫数组
   * @param {Array} entityList - 实体列表
   */
  drawMaze(mazeArray, entityList) {
    const dotContainer = document.getElementById('dot-container');
    const pickups = [this.gameCoord.fruit];

    this.gameCoord.mazeDiv.style.height = `${this.gameCoord.scaledTileSize * 31}px`;
    this.gameCoord.mazeDiv.style.width = `${this.gameCoord.scaledTileSize * 28}px`;
    this.gameCoord.gameUi.style.width = `${this.gameCoord.scaledTileSize * 28}px`;
    this.gameCoord.bottomRow.style.minHeight = `${this.gameCoord.scaledTileSize * 2}px`;

    mazeArray.forEach((row, rowIndex) => {
      row.forEach((block, columnIndex) => {
        if (block === 'o' || block === 'O') {
          // 绘制豆子
          const type = block === 'o' ? 'pacdot' : 'powerPellet';
          const points = block === 'o' ? 10 : 50;
          const dot = new Pickup(
            type,
            this.gameCoord.scaledTileSize,
            columnIndex,
            rowIndex,
            this.gameCoord.pacman,
            dotContainer,
            points,
          );

          entityList.push(dot);
          pickups.push(dot);
          this.gameCoord.remainingDots += 1;
        } else if (block === 't' || block === 'T') {
          // 绘制传送门
          const portal = new Portal(
            this.gameCoord.scaledTileSize,
            columnIndex,
            rowIndex,
            block,
            dotContainer,
          );

          entityList.push(portal);
          pickups.push(portal);
        }
      });
    });

    this.gameCoord.pickups = pickups;
    this.gameCoord.dotContainer = dotContainer;
  }

  static get maze() {
    return [
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOXXXXoXXXXXoXXoXXXXXoXXXXOX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XoXXXXoXXoXXXXXXXXoXXoXXXXoX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXXXXX XX XXXXXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['      o   X      X   o      '],
      ['XXXXXXoXX X      X XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX          XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XXXXXXoXX XXXXXXXX XXoXXXXXX'],
      ['XooooooooooooXXooooooooooooX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XoXXXXoXXXXXoXXoXXXXXoXXXXoX'],
      ['XOooXXooooooo  oooooooXXooOX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XXXoXXoXXoXXXXXXXXoXXoXXoXXX'],
      ['XooooooXXooooXXooooXXooooooX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XoXXXXXXXXXXoXXoXXXXXXXXXXoX'],
      ['XooooooooooooooooooooooooooX'],
      ['XXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
    ];
  }

  /**
   * 获取传送门配置
   * @returns {Object} 传送门配置对象
   */
  getPortalConfig() {
    // 扫描迷宫数组查找所有传送门
    const portals = [];

    this.mazeArray.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell === 't' || cell === 'T') {
          portals.push({
            id: `portal_${rowIndex}_${columnIndex}`,
            x: columnIndex,
            y: rowIndex,
            type: cell,
          });
        }
      });
    });

    // 验证传送门数量
    if (portals.length % 2 !== 0) {
      console.warn('传送门数量不成对，可能导致配对错误');
      return {
        pairs: [],
        scaledTileSize: this.gameCoord.scaledTileSize,
        soundManager: this.gameCoord.soundManager,
      };
    }

    // 按类型配对传送门
    const portalPairs = [];
    const tPortals = portals.filter(p => p.type === 't');
    const TPortals = portals.filter(p => p.type === 'T');

    // 确保数量相等
    if (tPortals.length !== TPortals.length) {
      console.warn('t 和 T 类型传送门数量不匹配');
      return {
        pairs: [],
        scaledTileSize: this.gameCoord.scaledTileSize,
        soundManager: this.gameCoord.soundManager,
      };
    }

    // 配对最近的传送门
    tPortals.forEach((tPortal) => {
      // 找到最近的 T 类型传送门
      const nearestTPortal = TPortals.reduce((nearest, current) => {
        const currentDist = Math.hypot(
          current.x - tPortal.x,
          current.y - tPortal.y,
        );
        const nearestDist = nearest ? Math.hypot(
          nearest.x - tPortal.x,
          nearest.y - tPortal.y,
        ) : Infinity;

        return currentDist < nearestDist ? current : nearest;
      }, null);

      if (nearestTPortal) {
        portalPairs.push({
          portal1Id: tPortal.id,
          portal2Id: nearestTPortal.id,
          portal1: tPortal,
          portal2: nearestTPortal,
        });
        // 从候选列表中移除已配对的传送门
        const index = TPortals.indexOf(nearestTPortal);
        if (index > -1) {
          TPortals.splice(index, 1);
        }
      }
    });

    return {
      pairs: portalPairs,
      scaledTileSize: this.gameCoord.scaledTileSize,
      soundManager: this.gameCoord.soundManager,
    };
  }
}

// removeIf(production)
module.exports = GameUtilities;
// endRemoveIf(production)
