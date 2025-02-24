class PortalManager {
  constructor() {
    this.portalPairs = new Map(); // 存储传送门配对关系
    this.cooldownTime = 1000; // 传送冷却时间（毫秒）
    this.isInCooldown = false;
  }

  /**
   * 初始化传送门系统
   * @param {Object} config - 传送门配置信息
   */
  init(config) {
    this.setupPortalPairs(config.portalPairs);
    this.soundManager = config.soundManager;
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
    const exitPortal = document.getElementById(exitPortalId);
    if (!exitPortal) {
      return;
    }

    // 播放传送音效
    this.soundManager.play('teleport');

    // 触发实体传送事件
    window.dispatchEvent(new CustomEvent('entityTeleported', {
      detail: {
        entity,
        targetPosition: {
          x: exitPortal.offsetLeft,
          y: exitPortal.offsetTop,
        },
      },
    }));
  }

  /**
   * 开始传送冷却
   */
  startCooldown() {
    this.isInCooldown = true;
    setTimeout(() => {
      this.isInCooldown = false;
    }, this.cooldownTime);
  }

  /**
   * 重置传送门系统
   */
  reset() {
    this.isInCooldown = false;
    // 可以在这里添加其他重置逻辑
  }
}

// removeIf(production)
module.exports = PortalManager;
// endRemoveIf(production)
