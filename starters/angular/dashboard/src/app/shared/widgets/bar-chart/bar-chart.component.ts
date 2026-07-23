import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  viewChild,
} from '@angular/core';
import { List } from 'immutable';

import { Widget } from '../widget';
import { DataItem } from '../../../data/types';
import { generateColorsArray, getNearestCeiledMax } from '../utils';
import { precisionRound } from '../../utils';
import { ChartLabelPipe } from '../../pipes/chart-label.pipe';
import { WidgetTooltipDirective } from '../widget-tooltip/widget-tooltip.directive';
import { WidgetScaleComponent } from '../widget-scale/widget-scale.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type BarChartConfig = void;

// UI elements paddings and margins

const MAX_BAR_WIDTH = 50;
const MIN_BAR_WIDTH = 30;
const BAR_SPACING = 15;

const BARS_TOP_PADDING = 15;
const BARS_BOTTOM_PADDING = 40;
const BARS_LEFT_PADDING = 65;
const BARS_RIGHT_PADDING = 30;

const LABELS_MARGIN_TOP = 20;
const SCALE_SIDE_PADDING = 10; // Relative to the bars

@Component({
  selector: 'db-bar-chart',
  imports: [
    ChartLabelPipe,
    WidgetTooltipDirective,
    WidgetScaleComponent,
    TranslatePipe,
  ],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent
  implements Widget<BarChartConfig, List<DataItem>>
{
  svgElement = viewChild.required<ElementRef>('svgElement');
  data = input.required<List<DataItem>>();
  config = input<BarChartConfig>();

  BAR_SPACING = BAR_SPACING;
  BARS_TOP_PADDING = BARS_TOP_PADDING;
  BARS_BOTTOM_PADDING = BARS_BOTTOM_PADDING;
  BARS_LEFT_PADDING = BARS_LEFT_PADDING;
  BARS_RIGHT_PADDING = BARS_RIGHT_PADDING;

  LABELS_MARGIN_TOP = LABELS_MARGIN_TOP;
  SCALE_SIDE_PADDING = SCALE_SIDE_PADDING;

  /**
   * Container size.
   */
  private _contSize = computed<{ width: number; height: number }>(() => {
    const { clientWidth, clientHeight } = this.svgElement().nativeElement;
    return {
      width: clientWidth - 2, // Some leeway to prevent scroll-y
      height: clientHeight,
    };
  });

  /**
   * Represents the scale/chart top boundary.
   */
  nearestMax = computed(() => {
    const max = this.data().max((l, r) => l.value - r.value);
    if (!max) {
      return 0;
    }

    return getNearestCeiledMax(max.value);
  });

  normalizedData = computed(() =>
    this.data().map((di) =>
      di.set(
        'value',
        Math.round((di.value / this.nearestMax()) * this.maxBarHeight()),
      ),
    ),
  );

  maxBarHeight = computed(
    () => this._contSize().height - BARS_TOP_PADDING - BARS_BOTTOM_PADDING,
  );

  /**
   * Calculates the bar width based on the container size
   * and the number of data entries.
   */
  barWidth = computed(() => {
    const s = this.data().size;
    let availableWidth =
      this._contSize().width - (BARS_LEFT_PADDING + BARS_RIGHT_PADDING);
    availableWidth -= BAR_SPACING * (s - 1);
    const width = precisionRound(availableWidth / s, 1);

    return Math.max(Math.min(width, MAX_BAR_WIDTH), MIN_BAR_WIDTH);
  });

  // Returns the greater of content or container width.
  // We need to set the SVG element width to it in case the content
  // is wider than the container or the window is resized after
  // rendering.
  contentWidth = computed(() => {
    const contentWidth =
      (this.barWidth() + BAR_SPACING) * this.data().size +
      BARS_LEFT_PADDING +
      BARS_RIGHT_PADDING;
    const containerWidth = this._contSize().width;

    return Math.max(contentWidth, containerWidth);
  });

  colorsArray = computed(() =>
    generateColorsArray(this.data().map((di) => di.label)),
  );
}
