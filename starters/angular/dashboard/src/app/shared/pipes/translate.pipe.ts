import { Pipe, PipeTransform } from '@angular/core';

/**
 * Builds a CSS-compatible `translate` string.
 * Used for SVG groups.
 */
@Pipe({
  name: 'translate',
})
export class TranslatePipe implements PipeTransform {
  transform(coor: number[]): string {
    return `translate(${coor[0]}, ${coor[1]})`;
  }
}
