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

    for (const row of mazeArray) {
      for (const cell of row) {
        if (cell === 't') tCount += 1;
        if (cell === 'T') TCount += 1;
      }
    }
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
          const portalId = `portal_${rowIndex}_${columnIndex}_${block}`;
          const portal = new Portal(
            this.gameCoord.scaledTileSize,
            columnIndex,
            rowIndex,
            this.gameCoord.pacman,
            dotContainer,
            portalId,
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
  getPortalConfig(mazeArray) { // 显式传入 mazeArray
    const portals = [];

    // 生成唯一 ID 并收集传送门
    mazeArray.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell === 't' || cell === 'T') {
          portals.push({
            id: `portal_${rowIndex}_${columnIndex}_${cell}`,
            x: columnIndex,
            y: rowIndex,
            type: cell,
          });
        }
      });
    });

    // 验证传送门数量
    if (!this.constructor.validatePortalPairs(mazeArray)) {
      return {
        pairs: [],
        scaledTileSize: this.gameCoord.scaledTileSize,
        soundManager: this.gameCoord.soundManager,
      };
    }

    // 按类型分组并配对
    const pairs = [];
    const tPortals = portals.filter(p => p.type === 't');
    const TPortals = portals.filter(p => p.type === 'T');

    // 一一配对
    for (let i = 0; i < tPortals.length; i += 1) {
      pairs.push({
        portal1Id: tPortals[i].id,
        portal2Id: TPortals[i].id,
        portal1: tPortals[i],
        portal2: TPortals[i],
      });
    }

    return {
      pairs,
      scaledTileSize: this.gameCoord.scaledTileSize,
      soundManager: this.gameCoord.soundManager,
    };
  }
}

// removeIf(production)
module.exports = GameUtilities;
// endRemoveIf(production)
