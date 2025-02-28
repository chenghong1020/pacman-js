/**
 * @jest-environment jsdom
 */
// 引入被测试的类
const PortalManager = require('../scripts/core/portalManager');

// 设置测试 DOM 环境
describe('PortalManager', () => {
  beforeAll(() => {
    // 创建测试用的 DOM 环境
    document.body.innerHTML = `
      <div id="maze">
        <div id="maze-container"></div>
      </div>
    `;
  });

  afterAll(() => {
    // 清理 DOM
    document.body.innerHTML = '';
  });

  let portalManager;
  let mockSoundManager;

  // 模拟实际游戏中的传送门配置数据
  // 修改模拟数据结构
  const mockPortalPairs = [
    {
      portal1Id: 'portal_5_2',
      portal2Id: 'portal_5_25',
      portal1: { id: 'portal_5_2', x: 2, y: 5 },
      portal2: { id: 'portal_5_25', x: 25, y: 5 },
    },
    {
      portal1Id: 'portal_15_2',
      portal2Id: 'portal_15_25',
      portal1: { id: 'portal_15_2', x: 2, y: 15 },
      portal2: { id: 'portal_15_25', x: 25, y: 15 },
    },
  ];

  beforeEach(() => {
    // 重置测试环境
    mockSoundManager = {
      play: jest.fn(),
    };

    portalManager = new PortalManager();
    portalManager.init({
      pairs: mockPortalPairs,
      scaledTileSize: 8,
      soundManager: mockSoundManager,
    });
  });

  describe('setupPortalPairs', () => {
    it('应该正确设置传送门配对关系', () => {
      // 验证配对是否正确设置
      expect(portalManager.portalPairs.get('portal_5_2')).toBe('portal_5_25');
      expect(portalManager.portalPairs.get('portal_5_25')).toBe('portal_5_2');
      expect(portalManager.portalPairs.get('portal_15_2')).toBe('portal_15_25');
      expect(portalManager.portalPairs.get('portal_15_25')).toBe('portal_15_2');
    });
  });

  describe('handlePortalEntry', () => {
    let mockEntity;

    beforeEach(() => {
      mockEntity = {
        measurement: 16, // Pacman 的尺寸
      };
      // 清除可能存在的冷却定时器
      jest.clearAllTimers();
    });

    it('在冷却时间内不应该触发传送', () => {
      // 第一次传送
      portalManager.handlePortalEntry({
        portalId: 'portal_5_2',
        entity: mockEntity,
      });

      // 立即尝试第二次传送
      portalManager.handlePortalEntry({
        portalId: 'portal_5_2',
        entity: mockEntity,
      });

      // 验证只触发了一次传送
      expect(mockSoundManager.play).toHaveBeenCalledTimes(1);
    });

    it('冷却结束后应该可以再次传送', (done) => {
      // 第一次传送
      portalManager.handlePortalEntry({
        portalId: 'portal_5_2',
        entity: mockEntity,
      });

      // 等待冷却时间结束
      setTimeout(() => {
        // 第二次传送
        portalManager.handlePortalEntry({
          portalId: 'portal_5_2',
          entity: mockEntity,
        });

        // 验证触发了两次传送
        expect(mockSoundManager.play).toHaveBeenCalledTimes(2);
        done();
      }, 1100); // 冷却时间为 1000ms
    });

    it('无效的传送门ID不应该触发传送', () => {
      portalManager.handlePortalEntry({
        portalId: 'invalid_portal',
        entity: mockEntity,
      });

      expect(mockSoundManager.play).not.toHaveBeenCalled();
    });
  });

  describe('teleportEntity', () => {
    let mockEntity;
    let mockEventDispatch;

    beforeEach(() => {
      mockEntity = {
        measurement: 16,
      };
      mockEventDispatch = jest.fn();
      global.window.dispatchEvent = mockEventDispatch;
    });

    it('应该正确计算目标位置并触发传送事件', () => {
      // 使用 portal2 的 ID 来测试
      const targetPortal = mockPortalPairs[0].portal2;
      portalManager.teleportEntity(mockEntity, targetPortal.id);

      expect(mockEventDispatch).toHaveBeenCalledWith(
        expect.any(CustomEvent),
      );

      const eventArg = mockEventDispatch.mock.calls[0][0];
      expect(eventArg.type).toBe('entityTeleported');

      // 计算预期的位置，包含 Pacman 的偏移量
      const expectedX = targetPortal.x * 8 + (8 - 16) / 2;
      const expectedY = targetPortal.y * 8 + (8 - 16) / 2;

      expect(eventArg.detail).toEqual({
        entity: mockEntity,
        targetPosition: {
          x: expectedX,
          y: expectedY,
        },
      });
    });
  });
});
