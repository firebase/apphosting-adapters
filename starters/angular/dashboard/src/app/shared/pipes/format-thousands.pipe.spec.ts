import { FormatThousandsPipe } from './format-thousands.pipe';

describe('FormatThousandsPipe', () => {
  let pipe: FormatThousandsPipe;

  beforeEach(() => {
    pipe = new FormatThousandsPipe();
  });

  it('should not format numbers < 1000', () => {
    expect(pipe.transform(999.123)).toEqual('999.1');
  });

  it('should format numbers >= 1000', () => {
    expect(pipe.transform(1000)).toEqual('1K');
    expect(pipe.transform(1500)).toEqual('1.5K');
    expect(pipe.transform(15000)).toEqual('15K');
    expect(pipe.transform(951500)).toEqual('951.5K');
  });

  it('should format numbers >= 1000000', () => {
    expect(pipe.transform(1000000)).toEqual('1M');
    expect(pipe.transform(1500000)).toEqual('1.5M');
  });
});
