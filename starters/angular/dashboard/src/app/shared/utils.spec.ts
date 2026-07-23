import { precisionRound } from './utils';

describe('Utils', () => {
  describe('precisionRound', () => {
    it('should round the number', async () => {
      expect(precisionRound(12.3456, 0)).toEqual(12);
    });

    it('should round to 1 digit after the decimal point', async () => {
      expect(precisionRound(12.3456, 1)).toEqual(12.3);
    });

    it('should round to 2 digits after the decimal point', async () => {
      expect(precisionRound(12.3456, 2)).toEqual(12.35);
    });

    it('should round to 3 digits after the decimal point', async () => {
      expect(precisionRound(12.3456, 3)).toEqual(12.346);
    });
  });
});
