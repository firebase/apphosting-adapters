import { ChartLabelPipe } from './chart-label.pipe';

describe('ChartLabelPipe', () => {
  let pipe: ChartLabelPipe;

  beforeEach(() => {
    pipe = new ChartLabelPipe();
  });

  it('should should not shorted words that shorter than 5 letters', () => {
    expect(pipe.transform('Italy')).toEqual('Italy');
  });

  it('should shorted single-worded text', () => {
    expect(pipe.transform('Australia')).toEqual('Aus.');
  });

  it('should abbreviate multiple-worded text', () => {
    expect(pipe.transform('United States')).toEqual('U. S.');
  });
});
