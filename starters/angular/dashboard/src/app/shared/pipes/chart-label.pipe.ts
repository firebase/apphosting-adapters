import { Pipe, PipeTransform } from '@angular/core';

/**
 * Shortens a label for presentation.
 */
@Pipe({
  name: 'chartLabel',
})
export class ChartLabelPipe implements PipeTransform {
  transform(value: string) {
    const words = value.split(' ');

    if (words.length > 2) {
      return words.map((w) => w[0] + '.').join(' ');
    } else if (words.length > 1) {
      return words
        .map((w) => {
          if (w.length > 4) {
            return w[0] + '.';
          }
          return w;
        })
        .join(' ');
    } else if (value.length > 5) {
      return value.substring(0, 3) + '.';
    }
    return value;
  }
}
