import { TranslatePipe } from './translate.pipe';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;

  beforeEach(() => {
    pipe = new TranslatePipe();
  });

  it('should build a translate string', () => {
    expect(pipe.transform([1, 2])).toEqual('translate(1, 2)');
  });
});
