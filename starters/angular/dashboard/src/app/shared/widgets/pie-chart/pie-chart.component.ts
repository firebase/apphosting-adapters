import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { Widget } from '../widget';
import { DataItem } from '../../../data/types';
import { List } from 'immutable';
import { generateColorsArray } from '../utils';
import { SectorPathDefinitionPipe } from './sector-path-definition.pipe';
import { WidgetTooltipDirective } from '../widget-tooltip/widget-tooltip.directive';
import { ChartLabelPipe } from '../../pipes/chart-label.pipe';
import { Coor, getAngleCoor } from './utils';
import { DecimalPipe } from '@angular/common';

export type PieChartConfig = void;

// Represents the radius of the pie chart based on
// the half of the container height, in percents.
const PIE_CHART_RADIUS = 0.6;

// Sets the minimal degree span of a sector
// to have a rendered label.
const MIN_DEGREES_FOR_LABEL = 10;

const SECTOR_WIDTH = 40;
const LABELS_MARGIN = 25; // Relative to the pie chart

@Component({
  selector: 'db-pie-chart',
  imports: [
    SectorPathDefinitionPipe,
    WidgetTooltipDirective,
    ChartLabelPipe,
    DecimalPipe,
  ],
  templateUrl: './pie-chart.component.html',
  styleUrl: './pie-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent
  implements Widget<PieChartConfig, List<DataItem>>
{
  svgElement = viewChild.required<ElementRef>('svgElement');
  data = input.required<List<DataItem>>();
  config = input<PieChartConfig>();

  SECTOR_WIDTH = SECTOR_WIDTH;
  PIE_CHART_RADIUS = PIE_CHART_RADIUS;

  private _totalAmount = computed(() =>
    this.data()
      .map((di) => di.value)
      .reduce((a, b) => a + b, 0),
  );

  normalizedData = computed(() =>
    this.data().map((di) => di.set('value', di.value / this._totalAmount())),
  );

  /**
   * The calculated sector start and end for each normalized data item.
   */
  sectors = computed<{ start: number; end: number }[]>(() => {
    const sectors: { start: number; end: number }[] = [];
    let start = 0;

    for (const di of this.normalizedData()) {
      sectors.push({
        start: start * 360,
        end: (start + di.value) * 360,
      });
      start += di.value;
    }

    return sectors;
  });

  /**
   * Labels with their coordinates based on the sectors.
   */
  labels = computed<({ name: string; pos: Coor } | null)[]>(() => {
    const center = this.center();
    const radius =
      this.center().y * PIE_CHART_RADIUS + SECTOR_WIDTH / 2 + LABELS_MARGIN;

    return this.sectors().map((s, i) => {
      if (s.end - s.start < MIN_DEGREES_FOR_LABEL) {
        return null;
      }
      return {
        name: this.data().get(i)!.label,
        pos: getAngleCoor((s.end + s.start) / 2, radius, center),
      };
    });
  });

  /**
   * Center of the pie chart.
   */
  center = computed<Coor>(() => {
    const { clientWidth, clientHeight } = this.svgElement().nativeElement;

    return {
      x: clientWidth / 2,
      y: clientHeight / 2,
    };
  });

  colorsArray = computed(() =>
    generateColorsArray(this.data().map((di) => di.label)),
  );
}
