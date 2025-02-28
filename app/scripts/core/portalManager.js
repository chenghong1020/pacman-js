/* eslint-disable max-len */
class PortalManager {
  constructor() {
    this.portalPairs = new Map(); // 存储传送门配对关系
    this.cooldownTime = 1000; // 传送冷却时间（毫秒）
    this.isInCooldown = false;
    this.cooldownTimer = null;
    this.scaledTileSize = null; // 添加瓦片大小属性
    this.characterUtil = null; // 添加 characterUtil 属性
  }

  /**
   * 初始化传送门系统
   * @param {Object} config - 传送门配置信息
   */
  init(config) {
    // 添加参数校验
    if (!config || !Array.isArray(config.pairs)) {
      // eslint-disable-next-line no-param-reassign
      config = {
        pairs: [],
        scaledTileSize: 8,
        soundManager: null,
      };
    }

    this.pairs = config.pairs; // 保存传送门配置数据
    this.setupPortalPairs(config.pairs);
    this.soundManager = config.soundManager;
    this.scaledTileSize = config.scaledTileSize;
    this.characterUtil = new CharacterUtil(config.scaledTileSize); // 初始化 CharacterUtil
  }

  /**
   * 设置传送门配对关系
   * @param {Array} pairs - 传送门配对数组
   */
  setupPortalPairs(pairs) {
    pairs.forEach((pair) => {
      this.portalPairs.set(pair.portal1Id, pair.portal2Id);
      this.portalPairs.set(pair.portal2Id, pair.portal1Id);
    });
  }

  /**
   * 处理实体进入传送门事件
   * @param {Object} detail - 事件详情
   * @param {string} detail.portalId - 传送门ID
   * @param {Object} detail.entity - 进入传送门的实体
   */
  handlePortalEntry(detail) {
    if (this.isInCooldown) {
      return;
    }

    const exitPortalId = this.portalPairs.get(detail.portalId);
    if (!exitPortalId) {
      return;
    }

    this.teleportEntity(detail.entity, exitPortalId);
    this.startCooldown();
  }

  /**
   * 传送实体到目标传送门
   * @param {Object} entity - 要传送的实体
   * @param {string} exitPortalId - 出口传送门ID
   */
  teleportEntity(entity, exitPortalId) {
    // 从配置数据中找到对应的传送门信息
    const portalPair = this.pairs.find(
      pair => pair.portal1Id === exitPortalId || pair.portal2Id === exitPortalId,
    );

    if (!portalPair) {
      return;
    }

    // 获取正确的传送门信息
    const exitPortalInfo = portalPair.portal1Id === exitPortalId
      ? portalPair.portal1 : portalPair.portal2;

    // 计算初始目标位置
    const initialPosition = {
      top: exitPortalInfo.y * this.scaledTileSize,
      left: exitPortalInfo.x * this.scaledTileSize,
    };

    // 使用 CharacterUtil 计算合适的出口位置
    const targetPosition = this.characterUtil.calculatePortalExitPosition(
      initialPosition,
      entity.direction,
      this.scaledTileSize,
    );

    // 如果实体是 Pacman，调整中心点偏移
    if (entity.measurement) {
      targetPosition.left += (this.scaledTileSize - entity.measurement) / 2;
      targetPosition.top += (this.scaledTileSize - entity.measurement) / 2;
    }

    // 播放传送音效
    this.soundManager.play('teleport');

    // 触发传送事件
    window.dispatchEvent(new CustomEvent('entityTeleported', {
      detail: {
        entity,
        targetPosition,
      },
    }));
  }

  /**
   * 开始传送冷却
   */
  startCooldown() {
    this.isInCooldown = true;

    // 清除可能存在的之前的定时器
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
    }

    this.cooldownTimer = setTimeout(() => {
      this.isInCooldown = false;
      this.cooldownTimer = null;
    }, this.cooldownTime);
  }

  /**
   * 重置传送门系统
   */
  reset() {
    // 清除冷却定时器
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }

    this.isInCooldown = false;
    // 可以在这里添加其他重置逻辑
  }
}

// removeIf(production)
module.exports = PortalManager;
// endRemoveIf(production)
