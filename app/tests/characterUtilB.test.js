/**
 * @jest-environment jsdom
 */

const CharacterUtil = require('../scripts/utilities/characterUtil');

describe('CharacterUtil', () => {
  let characterUtil;
  const mockScaledTileSize = 8;

  beforeEach(() => {
    characterUtil = new CharacterUtil(mockScaledTileSize);
  });

  describe('calculatePortalExitPosition', () => {
    const mockPortalPosition = {
      top: 100,
      left: 200,
    };

    it('should calculate correct exit position when moving up', () => {
      const result = characterUtil.calculatePortalExitPosition(
        mockPortalPosition,
        characterUtil.directions.up,
        mockScaledTileSize,
      );

      expect(result).toEqual({
        top: 100 - (mockScaledTileSize * 1.5),
        left: 200,
      });
    });

    it('should calculate correct exit position when moving down', () => {
      const result = characterUtil.calculatePortalExitPosition(
        mockPortalPosition,
        characterUtil.directions.down,
        mockScaledTileSize,
      );

      expect(result).toEqual({
        top: 100 + (mockScaledTileSize * 1.5),
        left: 200,
      });
    });

    it('should calculate correct exit position when moving left', () => {
      const result = characterUtil.calculatePortalExitPosition(
        mockPortalPosition,
        characterUtil.directions.left,
        mockScaledTileSize,
      );

      expect(result).toEqual({
        top: 100,
        left: 200 - (mockScaledTileSize * 1.5),
      });
    });

    it('should calculate correct exit position when moving right', () => {
      const result = characterUtil.calculatePortalExitPosition(
        mockPortalPosition,
        characterUtil.directions.right,
        mockScaledTileSize,
      );

      expect(result).toEqual({
        top: 100,
        left: 200 + (mockScaledTileSize * 1.5),
      });
    });

    it('should keep original position for unknown direction', () => {
      const result = characterUtil.calculatePortalExitPosition(
        mockPortalPosition,
        'invalid_direction',
        mockScaledTileSize,
      );

      expect(result).toEqual({
        top: 100,
        left: 200,
      });
    });

    it('should not modify original portal position', () => {
      const originalPosition = {
        top: 100,
        left: 200,
      };

      characterUtil.calculatePortalExitPosition(
        originalPosition,
        characterUtil.directions.up,
        mockScaledTileSize,
      );

      expect(originalPosition).toEqual({
        top: 100,
        left: 200,
      });
    });
  });
});
