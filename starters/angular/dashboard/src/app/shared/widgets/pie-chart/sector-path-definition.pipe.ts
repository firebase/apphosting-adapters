import { Pipe, PipeTransform } from '@angular/core';
import { Coor, getAngleCoor } from './utils';

/**
 * Calculates the path definition of a sector arc.
 */
@Pipe({
  name: 'sectorPathDefinition',
})
export class SectorPathDefinitionPipe implements PipeTransform {
  transform(
    data: { start: number; end: number },
    args: { center: Coor; radius: number },
  ) {
    const { center, radius } = args;

    return this._arc(data.start, data.end, radius, center);
  }

  /**
   * Calculate path definition of an arc for a given sector.
   */
  private _arc(
    start: number,
    end: number,
    radius: number,
    center: Coor,
  ): string {
    const largeArc = end - start <= 180 ? 0 : 1;
    const startCoor = getAngleCoor(start, radius, center);
    const endCoor = getAngleCoor(end, radius, center);

    return `M ${endCoor.x} ${endCoor.y} A ${radius} ${radius} 0 ${largeArc} 0 ${startCoor.x} ${startCoor.y}`;
  }
}
