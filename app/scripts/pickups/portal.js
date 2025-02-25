class Portal extends Pickup {
  constructor(scaledTileSize, column, row, pacman, mazeDiv, portalId) {
    // 调用父类构造函数，传入 portal 类型，无分数
    super('portal', scaledTileSize, column, row, pacman, mazeDiv, 0);
    
    this.portalId = portalId;
    this.breathingTimer = 0;
    this.breathingScale = 1;
    this.breathingDirection = 1;

    // 初始化传送门动画
    this.initPortalAnimation();
  }

  /**
   * 初始化传送门动画样式
   */
  initPortalAnimation() {
    this.animationTarget.classList.add('portal');
    this.animationTarget.style.transition = 'transform 0.3s ease-in-out';
  }

  /**
   * 重写父类的 determineImage 方法
   */
  determineImage() {
    return 'url(app/style/graphics/spriteSheets/pickups/portal.svg)';
  }

  /**
   * 更新传送门动画状态（呼吸效果）
   */
  updateAnimation() {
    this.breathingTimer += 0.1;
    this.breathingScale += 0.01 * this.breathingDirection;
    
    if (this.breathingScale >= 1.2) {
      this.breathingDirection = -1;
    } else if (this.breathingScale <= 0.8) {
      this.breathingDirection = 1;
    }

    this.animationTarget.style.transform = `scale(${this.breathingScale})`;
  }

  /**
   * 重写父类的 update 方法
   */
  update() {
    this.updateAnimation();

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
        // 触发传送门进入事件
        window.dispatchEvent(new CustomEvent('portalEntered', {
          detail: {
            portalId: this.portalId,
            entity: this.pacman
          }
        }));
      }
    }
  }

  /**
   * 重写父类的 reset 方法
   */
  reset() {
    this.animationTarget.style.visibility = 'visible';
    this.breathingScale = 1;
    this.breathingDirection = 1;
    this.animationTarget.style.transform = 'scale(1)';
  }
}

// removeIf(production)
module.exports = Portal;
// endRemoveIf(production)