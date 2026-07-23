import { Pipe, PipeTransform } from '@angular/core';
import { precisionRound } from '../utils';

/**
 * Rounds and shortens large numbers.
 */
@Pipe({
  name: 'formatThousands',
})
export class FormatThousandsPipe implements PipeTransform {
  transform(value: number) {
    if (value >= 1000000) {
      const d = value / 1000000;
      return precisionRound(d, 1) + 'M';
    } else if (value >= 1000) {
      const d = value / 1000;
      return precisionRound(d, 1) + 'K';
    }
    return precisionRound(value, 1).toString();
  }
}
