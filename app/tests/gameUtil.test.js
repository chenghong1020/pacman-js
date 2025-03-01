// 设置 jsdom 环境
// eslint-disable-next-line import/no-extraneous-dependencies
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

const Pickup = require('../scripts/pickups/pickup');
// 添加全局类
global.Pickup = Pickup;


const Portal = require('../scripts/pickups/portal');

global.Portal = Portal;

const GameUtilities = require('../scripts/core/gameUtil');

jest.mock('../scripts/pickups/pickup');
jest.mock('../scripts/pickups/portal');

describe('GameUtilities', () => {
  let gameUtil;
  let mockGameCoord;
  let mockDotContainer;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();

    // 创建模拟的 DOM 元素
    mockDotContainer = document.createElement('div');
    mockDotContainer.id = 'dot-container';
    document.body.appendChild(mockDotContainer);

    // 创建模拟的 gameCoord 对象
    mockGameCoord = {
      fruit: {},
      mazeDiv: { style: {} },
      gameUi: { style: {} },
      bottomRow: { style: {} },
      scaledTileSize: 10,
      pacman: {},
      remainingDots: 0,
      pickups: [],
      dotContainer: null,
    };

    gameUtil = new GameUtilities(mockGameCoord);
  });

  afterEach(() => {
    document.body.removeChild(mockDotContainer);
  });

  describe('drawMaze', () => {
    it('should set correct maze dimensions', () => {
      const mazeArray = [['o']];
      const entityList = [];

      gameUtil.drawMaze(mazeArray, entityList);

      expect(mockGameCoord.mazeDiv.style.height).toBe('310px');
      expect(mockGameCoord.mazeDiv.style.width).toBe('280px');
      expect(mockGameCoord.gameUi.style.width).toBe('280px');
      expect(mockGameCoord.bottomRow.style.minHeight).toBe('20px');
    });

    it('should create pacdot pickup for "o"', () => {
      const mazeArray = [['o']];
      const entityList = [];

      gameUtil.drawMaze(mazeArray, entityList);

      expect(Pickup).toHaveBeenCalledWith(
        'pacdot',
        10,
        0,
        0,
        mockGameCoord.pacman,
        mockDotContainer,
        10,
      );
      expect(entityList.length).toBe(1);
      expect(mockGameCoord.remainingDots).toBe(1);
    });

    it('should create power pellet pickup for "O"', () => {
      const mazeArray = [['O']];
      const entityList = [];

      gameUtil.drawMaze(mazeArray, entityList);

      expect(Pickup).toHaveBeenCalledWith(
        'powerPellet',
        10,
        0,
        0,
        mockGameCoord.pacman,
        mockDotContainer,
        50,
      );
      expect(entityList.length).toBe(1);
      expect(mockGameCoord.remainingDots).toBe(1);
    });

    it('should create portal for "t" and "T"', () => {
      const mazeArray = [['t', 'T']];
      const entityList = [];

      gameUtil.drawMaze(mazeArray, entityList);

      expect(Portal).toHaveBeenCalledTimes(2);
      expect(Portal).toHaveBeenNthCalledWith(
        1,
        10,
        0,
        0,
        mockGameCoord.pacman,
        mockDotContainer,
        'portal_0_0_t',
      );
      expect(Portal).toHaveBeenNthCalledWith(
        2,
        10,
        1,
        0,
        mockGameCoord.pacman,
        mockDotContainer,
        'portal_0_1_T',
      );
      expect(entityList.length).toBe(2);
    });

    it('should handle empty maze array', () => {
      const mazeArray = [[]];
      const entityList = [];

      gameUtil.drawMaze(mazeArray, entityList);

      expect(entityList.length).toBe(0);
      expect(mockGameCoord.remainingDots).toBe(0);
    });

    it('should update gameCoord properties', () => {
      const mazeArray = [['o', 'T']];
      const entityList = [];

      gameUtil.drawMaze(mazeArray, entityList);

      expect(mockGameCoord.pickups.length).toBe(3); // fruit + dot + portal
      expect(mockGameCoord.dotContainer).toBe(mockDotContainer);
    });
  });
});
