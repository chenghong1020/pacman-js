// eslint-disable-next-line import/no-unresolved, import/extensions
const GamePlayer = require('../scripts/core/gamePlayer');

// 模拟 Portal 类
class Portal {
  constructor(type, pairType) {
    this.type = type;
    this.pairType = pairType;
  }
}

// 将 Portal 类添加到全局作用域
global.Portal = Portal;

describe('GamePlayer', () => {
  let gamePlayer;
  let mockGameCoord;

  beforeEach(() => {
    // 模拟 window 对象
    global.window = {
      addEventListener: jest.fn(),
    };

    // 设置基础的 mock 对象
    mockGameCoord = {
      entityList: [],
    };
    gamePlayer = new GamePlayer(mockGameCoord);
  });

  afterEach(() => {
    // 清理全局模拟
    delete global.window;
  });

  describe('findPairPortal', () => {
    it('应该能找到匹配的传送门', () => {
      // 准备测试数据
      const sourcePortal = new Portal('A', 'B');
      const targetPortal = new Portal('B', 'A');
      const otherEntity = { type: 'something-else' };

      mockGameCoord.entityList = [
        otherEntity,
        targetPortal,
        sourcePortal,
      ];

      // 执行测试
      const result = gamePlayer.findPairPortal(sourcePortal);

      // 验证结果
      expect(result).toBe(targetPortal);
    });

    it('当没有匹配的传送门时应该返回 undefined', () => {
      // 准备测试数据
      const sourcePortal = new Portal('A', 'B');
      const wrongPortal = new Portal('C', 'D');

      mockGameCoord.entityList = [
        wrongPortal,
        { type: 'something-else' },
      ];

      // 执行测试
      const result = gamePlayer.findPairPortal(sourcePortal);

      // 验证结果
      expect(result).toBeUndefined();
    });

    it('当实体列表为空时应该返回 undefined', () => {
      // 准备测试数据
      const sourcePortal = new Portal('A', 'B');
      mockGameCoord.entityList = [];

      // 执行测试
      const result = gamePlayer.findPairPortal(sourcePortal);

      // 验证结果
      expect(result).toBeUndefined();
    });

    it('应该正确处理非 Portal 实例', () => {
      // 准备测试数据
      const sourcePortal = new Portal('A', 'B');
      mockGameCoord.entityList = [
        { type: 'B' }, // 有相同类型但不是 Portal 实例
        { type: 'something-else' },
      ];

      // 执行测试
      const result = gamePlayer.findPairPortal(sourcePortal);

      // 验证结果
      expect(result).toBeUndefined();
    });
  });

  describe('handleTeleport', () => {
    let mockPacman;
    let mockSoundManager;

    beforeEach(() => {
      // 扩展 mockGameCoord
      mockPacman = {
        moving: true,
        animate: true,
        position: { left: 0, top: 0 },
        oldPosition: { left: 0, top: 0 },
        direction: 'right',
      };

      mockSoundManager = {
        play: jest.fn(),
      };

      mockGameCoord.pacman = mockPacman;
      mockGameCoord.soundManager = mockSoundManager;
      mockGameCoord.scaledTileSize = 10;
    });

    it('冷却时间内不应该允许传送', () => {
      // 准备测试数据
      const sourcePortal = new Portal('A', 'B');
      sourcePortal.isActive = true;
      const targetPortal = new Portal('B', 'A');

      // 设置最近传送时间为当前时间
      gamePlayer.lastTeleportTime = Date.now();

      // 创建传送事件
      const teleportEvent = {
        detail: {
          source: sourcePortal,
          target: targetPortal,
        },
      };

      // 执行测试
      gamePlayer.handleTeleport(teleportEvent);

      // 验证结果：位置应该保持不变
      expect(mockPacman.position).toEqual({ left: 0, top: 0 });
      expect(mockSoundManager.play).not.toHaveBeenCalled();
    });

    it('Pacman未移动时不应该传送', () => {
      // 设置 Pacman 为静止状态
      mockPacman.moving = false;

      const sourcePortal = new Portal('A', 'B');
      sourcePortal.isActive = true;
      const targetPortal = new Portal('B', 'A');

      // 设置上次传送时间为很久以前
      gamePlayer.lastTeleportTime = 0;

      const teleportEvent = {
        detail: {
          source: sourcePortal,
          target: targetPortal,
        },
      };

      // 执行测试
      gamePlayer.handleTeleport(teleportEvent);

      // 验证结果
      expect(mockPacman.position).toEqual({ left: 0, top: 0 });
      expect(mockSoundManager.play).not.toHaveBeenCalled();
    });

    it('传送门未激活时不应该传送', () => {
      const sourcePortal = new Portal('A', 'B');
      sourcePortal.isActive = false;
      const targetPortal = new Portal('B', 'A');

      gamePlayer.lastTeleportTime = 0;

      const teleportEvent = {
        detail: {
          source: sourcePortal,
          target: targetPortal,
        },
      };

      // 执行测试
      gamePlayer.handleTeleport(teleportEvent);

      // 验证结果
      expect(mockPacman.position).toEqual({ left: 0, top: 0 });
      expect(mockSoundManager.play).not.toHaveBeenCalled();
    });

    it('应该成功执行传送', () => {
      const sourcePortal = new Portal('A', 'B');
      sourcePortal.isActive = true;
      sourcePortal.startCooldown = jest.fn();

      const targetPortal = new Portal('B', 'A');
      targetPortal.x = 100;
      targetPortal.y = 200;
      targetPortal.direction = 'left';
      targetPortal.startCooldown = jest.fn();

      mockGameCoord.entityList = [sourcePortal, targetPortal];
      gamePlayer.lastTeleportTime = 0;

      const teleportEvent = {
        detail: {
          source: sourcePortal,
          target: targetPortal,
        },
      };

      // 执行测试
      gamePlayer.handleTeleport(teleportEvent);

      // 验证结果
      expect(mockPacman.position).toEqual({
        left: targetPortal.x - mockGameCoord.scaledTileSize * 0.5,
        top: targetPortal.y,
      });
      expect(mockPacman.direction).toBe('left');
      expect(mockPacman.animate).toBe(false);
      expect(mockSoundManager.play).toHaveBeenCalledWith('teleport');
      expect(sourcePortal.startCooldown).toHaveBeenCalled();
    });
  });

  describe('executeTeleport', () => {
    let mockPacman;
    let mockSoundManager;

    beforeEach(() => {
      jest.useFakeTimers();

      mockPacman = {
        animate: true,
        position: { left: 0, top: 0 },
        oldPosition: { left: 0, top: 0 },
        direction: 'right',
      };

      mockSoundManager = {
        play: jest.fn(),
      };

      mockGameCoord.pacman = mockPacman;
      mockGameCoord.soundManager = mockSoundManager;
      mockGameCoord.scaledTileSize = 10;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('应该正确处理向左传送', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'left',
      };

      gamePlayer.executeTeleport(target);

      expect(mockPacman.position).toEqual({
        left: 95, // 100 - (10 * 0.5)
        top: 200,
      });
      expect(mockPacman.direction).toBe('left');
    });

    it('应该正确处理向右传送', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'right',
      };

      gamePlayer.executeTeleport(target);

      expect(mockPacman.position).toEqual({
        left: 105, // 100 + (10 * 0.5)
        top: 200,
      });
      expect(mockPacman.direction).toBe('right');
    });

    it('应该正确处理向上传送', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'up',
      };

      gamePlayer.executeTeleport(target);

      expect(mockPacman.position).toEqual({
        left: 100,
        top: 195, // 200 - (10 * 0.5)
      });
      expect(mockPacman.direction).toBe('up');
    });

    it('应该正确处理向下传送', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'down',
      };

      gamePlayer.executeTeleport(target);

      expect(mockPacman.position).toEqual({
        left: 100,
        top: 205, // 200 + (10 * 0.5)
      });
      expect(mockPacman.direction).toBe('down');
    });

    it('应该暂停和恢复动画', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'left',
      };

      gamePlayer.executeTeleport(target);

      // 检查动画是否被暂停
      expect(mockPacman.animate).toBe(false);

      // 快进定时器
      jest.advanceTimersByTime(50);

      // 检查动画是否被恢复
      expect(mockPacman.animate).toBe(true);
    });

    it('应该更新oldPosition以确保重绘', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'left',
      };

      gamePlayer.executeTeleport(target);

      const expectedPosition = {
        left: 95,
        top: 200,
      };

      expect(mockPacman.oldPosition).toEqual(expectedPosition);
    });

    it('应该播放传送音效', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'left',
      };

      gamePlayer.executeTeleport(target);

      expect(mockSoundManager.play).toHaveBeenCalledWith('teleport');
    });
  });

  describe('calculateAlignedPosition', () => {
    beforeEach(() => {
      mockGameCoord.scaledTileSize = 10;
    });

    it('应该正确计算向左方向的位置', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'left',
      };

      const result = gamePlayer.calculateAlignedPosition(target);

      expect(result).toEqual({
        left: 95, // 100 - (10 * 0.5)
        top: 200,
      });
    });

    it('应该正确计算向右方向的位置', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'right',
      };

      const result = gamePlayer.calculateAlignedPosition(target);

      expect(result).toEqual({
        left: 105, // 100 + (10 * 0.5)
        top: 200,
      });
    });

    it('应该正确计算向上方向的位置', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'up',
      };

      const result = gamePlayer.calculateAlignedPosition(target);

      expect(result).toEqual({
        left: 100,
        top: 195, // 200 - (10 * 0.5)
      });
    });

    it('应该正确计算向下方向的位置', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'down',
      };

      const result = gamePlayer.calculateAlignedPosition(target);

      expect(result).toEqual({
        left: 100,
        top: 205, // 200 + (10 * 0.5)
      });
    });

    it('当方向未指定时应该返回原始坐标', () => {
      const target = {
        x: 100,
        y: 200,
        direction: 'invalid',
      };

      const result = gamePlayer.calculateAlignedPosition(target);

      expect(result).toEqual({
        left: 100,
        top: 200,
      });
    });
  });
});
