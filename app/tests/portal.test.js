// eslint-disable-next-line import/no-extraneous-dependencies
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.CustomEvent = window.CustomEvent;

const { Portal } = require('../scripts/pickups/pickup');

describe('Portal', () => {
  let portal;
  let mockMazeDiv;
  let mockGameCoordinator;

  beforeEach(() => {
    // 模拟 DOM 元素
    mockMazeDiv = {
      appendChild: jest.fn(),
    };

    // 模拟游戏协调器
    mockGameCoordinator = {
      pacman: {
        position: {
          left: 100,
          top: 100,
        },
        direction: 'left',
      },
    };

    // 模拟迷宫数组
    const mockMazeArray = [
      ['B'], // 假设 'B' 是配对的传送门类型
      ['A'],
    ];

    portal = new Portal(
      'A', // type
      16, // scaledTileSize
      5, // column
      5, // row
      'B', // pairType
      mockMazeDiv, // mazeDiv
      mockMazeArray, // mazeArray
      mockGameCoordinator, // gameCoordinator
    );
  });

  test('Portal 初始化时应该正确设置属性', () => {
    expect(portal.type).toBe('A');
    expect(portal.pairType).toBe('B');
    expect(portal.scaledTileSize).toBe(16);
    expect(portal.isActive).toBe(true);
    expect(portal.cooldown).toBe(3000);
    expect(portal.lastUsed).toBe(0);
    expect(portal.nearPacman).toBe(false);
  });

  test('setupAnimationTarget 应该创建正确的 DOM 元素', () => {
    expect(mockMazeDiv.appendChild).toHaveBeenCalled();
    expect(portal.animationTarget.style.position).toBe('absolute');
    expect(portal.animationTarget.style.backgroundSize).toBe('32px');
    expect(portal.animationTarget.style.zIndex).toBe('1');
  });

  test('checkPacmanProximity 应该正确计算与 Pacman 的距离', () => {
    // Test for when Pacman is nearby (within 50 pixels)
    const nearbyPacmanCenter = { x: 80, y: 80 };
    portal.checkPacmanProximity(50, nearbyPacmanCenter);
    expect(portal.nearPacman).toBe(true);

    // Test for when Pacman is far away (more than 20 pixels)
    const farPacmanCenter = { x: 120, y: 120 }; // 40 pixels away diagonally
    portal.checkPacmanProximity(20, farPacmanCenter);
    expect(portal.nearPacman).toBe(false);
  });

  test('getPairPosition 应该返回配对传送门的位置', () => {
    const position = portal.getPairPosition();
    expect(position).toEqual({
      x: 8, // (0 + 0.5) * 16
      y: 8, // (0 + 0.5) * 16
    });
  });

  test('startCooldown 应该正确设置冷却状态', () => {
    jest.useFakeTimers();

    portal.startCooldown();
    expect(portal.isActive).toBe(false);
    expect(portal.animationTarget.style.opacity).toBe('0.3');

    jest.advanceTimersByTime(3000);
    expect(portal.isActive).toBe(true);
    expect(portal.animationTarget.style.opacity).toBe('1');
  });

  test('shouldCheckForCollision 应该正确判断是否需要检测碰撞', () => {
    // Case 1: 所有条件都满足时应返回 true
    portal.isActive = true;
    portal.nearPacman = true;
    portal.animationTarget.style.visibility = 'visible';
    expect(portal.shouldCheckForCollision()).toBe(true);

    // Case 2: portal 不活跃时应返回 false
    portal.isActive = false;
    portal.nearPacman = true;
    portal.animationTarget.style.visibility = 'visible';
    expect(portal.shouldCheckForCollision()).toBe(false);

    // Case 3: portal 不可见时应返回 false
    portal.isActive = true;
    portal.nearPacman = true;
    portal.animationTarget.style.visibility = 'hidden';
    expect(portal.shouldCheckForCollision()).toBe(false);

    // Case 4: pacman 不在附近时应返回 false
    portal.isActive = true;
    portal.nearPacman = false;
    portal.animationTarget.style.visibility = 'visible';
    expect(portal.shouldCheckForCollision()).toBe(false);

    // Case 5: 多个条件不满足时应返回 false
    portal.isActive = false;
    portal.nearPacman = false;
    portal.animationTarget.style.visibility = 'hidden';
    expect(portal.shouldCheckForCollision()).toBe(false);
  });

  test('checkCollision 应该正确检测碰撞', () => {
    // 设置 Pacman 位置靠近传送门
    mockGameCoordinator.pacman.position = {
      left: portal.x,
      top: portal.y,
    };

    expect(portal.checkCollision()).toBe(true);

    // 设置 Pacman 位置远离传送门
    mockGameCoordinator.pacman.position = {
      left: portal.x + 100,
      top: portal.y + 100,
    };

    expect(portal.checkCollision()).toBe(false);
  });

  test('triggerTeleport 应该触发正确的传送事件', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    const targetPos = { x: 100, y: 100 };

    portal.triggerTeleport(targetPos);

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.any(CustomEvent),
    );

    const eventDetail = dispatchEventSpy.mock.calls[0][0].detail;
    expect(eventDetail.source).toBe(portal);
    expect(eventDetail.target.x).toBe(targetPos.x - portal.scaledTileSize);
    expect(eventDetail.target.y).toBe(targetPos.y - portal.scaledTileSize);
    expect(eventDetail.target.direction).toBe('left');

    dispatchEventSpy.mockRestore();
  });

  test('update 应该正确处理传送门的更新逻辑', () => {
    // Mock Date.now()
    const mockNow = jest.spyOn(Date, 'now');
    mockNow.mockReturnValue(5000);

    // Mock 相关方法
    jest.spyOn(portal, 'shouldCheckForCollision');
    jest.spyOn(portal, 'checkCollision');
    jest.spyOn(portal, 'getPairPosition');
    jest.spyOn(portal, 'triggerTeleport');
    jest.spyOn(portal, 'startCooldown');

    // Case 1: shouldCheckForCollision 返回 false
    portal.shouldCheckForCollision.mockReturnValue(false);
    portal.update();
    expect(portal.checkCollision).not.toHaveBeenCalled();
    expect(portal.getPairPosition).not.toHaveBeenCalled();

    // Case 2: shouldCheckForCollision 为 true，但 checkCollision 为 false
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkCollision.mockReturnValue(false);
    portal.update();
    expect(portal.getPairPosition).not.toHaveBeenCalled();

    // Case 3: 在冷却时间内
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkCollision.mockReturnValue(true);
    portal.lastUsed = 4000; // 1000ms ago, cooldown is 3000ms
    portal.update();
    expect(portal.getPairPosition).not.toHaveBeenCalled();

    // Case 4: getPairPosition 返回 null
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkCollision.mockReturnValue(true);
    portal.lastUsed = 1000; // 4000ms ago
    portal.getPairPosition.mockReturnValue(null);
    portal.update();
    expect(portal.triggerTeleport).not.toHaveBeenCalled();
    expect(portal.startCooldown).not.toHaveBeenCalled();

    // Case 5: 所有条件都满足
    const mockPairPos = { x: 100, y: 100 };
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkCollision.mockReturnValue(true);
    portal.lastUsed = 1000;
    portal.getPairPosition.mockReturnValue(mockPairPos);
    portal.update();
    expect(portal.triggerTeleport).toHaveBeenCalledWith(mockPairPos);
    expect(portal.startCooldown).toHaveBeenCalled();

    // 清理所有 mock
    mockNow.mockRestore();
    jest.restoreAllMocks();
  });
});
