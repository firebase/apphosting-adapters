import { getNearestCeiledMax } from './utils';

describe('Widget > Utils', () => {
  describe('getNearestCeilingMax', () => {
    it('it should ceil 121 to 130', async () => {
      expect(getNearestCeiledMax(121)).toEqual(130);
    });

    it('it should ceil 1310 to 1400', async () => {
      expect(getNearestCeiledMax(1310)).toEqual(1400);
    });

    it('it should ceil 14100 to 15000', async () => {
      expect(getNearestCeiledMax(14500)).toEqual(15000);
    });

    it('it should ceil 171000 to 180000', async () => {
      expect(getNearestCeiledMax(171000)).toEqual(180000);
    });

    it('it should ceil 1620000 to 1700000', async () => {
      expect(getNearestCeiledMax(1620000)).toEqual(1700000);
    });
  });
});
