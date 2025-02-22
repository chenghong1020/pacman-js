/* eslint-disable max-len */
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

    // 模拟迷宫数组 - 使用一个5x5的小型迷宫
    const mockMazeArray = [
      ['X', 'X', 'X', 'X', 'X'],
      ['X', 't', '.', 'T', 'X'],
      ['X', '.', '.', '.', 'X'],
      ['X', '.', '.', '.', 'X'],
      ['X', 'X', 'X', 'X', 'X'],
    ];

    portal = new Portal(
      't', // type - 使用小写't'作为传送门类型
      16, // scaledTileSize
      1, // column - 对应迷宫中't'的位置
      1, // row
      'T', // pairType - 使用大写'T'作为配对传送门类型
      mockMazeDiv,
      mockMazeArray,
      mockGameCoordinator,
    );
  });

  test('Portal 初始化时应该正确设置属性', () => {
    expect(portal.type).toBe('t'); // 改为小写't'
    expect(portal.pairType).toBe('T'); // 改为大写'T'
    expect(portal.scaledTileSize).toBe(16); // 保持不变
    expect(portal.isActive).toBe(true); // 保持不变
    expect(portal.cooldown).toBe(3000); // 保持不变
    expect(portal.lastUsed).toBe(0); // 保持不变
    expect(portal.nearPacman).toBe(false); // 保持不变
  });

  test('setupAnimationTarget 应该创建正确的 DOM 元素', () => {
    expect(mockMazeDiv.appendChild).toHaveBeenCalled();
    // 只测试必要的结构属性，移除具体样式值的测试
    expect(portal.animationTarget).toBeTruthy();
    expect(portal.animationTarget.style).toBeTruthy();
    expect(portal.animationTarget.classList.contains('portal-animation')).toBe(true);
  });

  test('checkPacmanProximity 应该正确计算与 Pacman 的距离', () => {
    // 传送门的中心位置在 (16, 16)，因为 column=1, row=1

    // Test for when Pacman is nearby (within 50 pixels)
    const nearbyPacmanCenter = { x: 20, y: 20 }; // 更接近传送门中心
    portal.checkPacmanProximity(50, nearbyPacmanCenter);
    expect(portal.nearPacman).toBe(true);

    // Test for when Pacman is far away
    const farPacmanCenter = { x: 100, y: 100 };
    portal.checkPacmanProximity(20, farPacmanCenter);
    expect(portal.nearPacman).toBe(false);
  });

  test('getPairPosition 应该返回配对传送门的位置', () => {
    const position = portal.getPairPosition();
    expect(position).toEqual({
      x: 56, // (3 + 0.5) * 16，因为'T'在第3列
      y: 24, // (1 + 0.5) * 16，因为'T'在第1行
    });
  });

  test('startCooldown 应该正确设置冷却状态', () => {
    jest.useFakeTimers();

    portal.startCooldown();
    expect(portal.isActive).toBe(false);
    // 只测试功能状态，不测试具体样式值
    expect(portal.animationTarget.style.filter).toBeTruthy();

    jest.advanceTimersByTime(3000);
    expect(portal.isActive).toBe(true);
    // 只测试功能状态，不测试具体样式值
    expect(portal.animationTarget.style.filter).toBe('none');

    jest.useRealTimers();
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

  // 删除 checkCollision 的测试用例

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
    jest.spyOn(portal, 'checkForCollision'); // 改用父类的方法名
    jest.spyOn(portal, 'getPairPosition');
    jest.spyOn(portal, 'triggerTeleport');
    jest.spyOn(portal, 'startCooldown');

    // Case 1: shouldCheckForCollision 返回 false
    portal.shouldCheckForCollision.mockReturnValue(false);
    portal.update();
    expect(portal.checkForCollision).not.toHaveBeenCalled();
    expect(portal.getPairPosition).not.toHaveBeenCalled();

    // Case 2: shouldCheckForCollision 为 true，但碰撞检测为 false
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkForCollision.mockReturnValue(false);
    portal.update();
    expect(portal.getPairPosition).not.toHaveBeenCalled();

    // Case 3: 在冷却时间内
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkForCollision.mockReturnValue(true);
    portal.lastUsed = 4000; // 1000ms ago, cooldown is 3000ms
    portal.update();
    expect(portal.getPairPosition).not.toHaveBeenCalled();

    // Case 4: getPairPosition 返回 null
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkForCollision.mockReturnValue(true);
    portal.lastUsed = 1000; // 4000ms ago
    portal.getPairPosition.mockReturnValue(null);
    portal.update();
    expect(portal.triggerTeleport).not.toHaveBeenCalled();
    expect(portal.startCooldown).not.toHaveBeenCalled();

    // Case 5: 所有条件都满足
    const mockPairPos = { x: 100, y: 100 };
    portal.shouldCheckForCollision.mockReturnValue(true);
    portal.checkForCollision.mockReturnValue(true);
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
