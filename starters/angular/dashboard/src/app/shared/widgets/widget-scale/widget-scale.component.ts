import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormatThousandsPipe } from '../../pipes/format-thousands.pipe';

const LINES_COUNT = 4;
const LABELS_MARGIN_RIGHT = 10;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[dbWidgetScale]',
  imports: [FormatThousandsPipe],
  templateUrl: './widget-scale.component.html',
  styleUrl: './widget-scale.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetScaleComponent {
  max = input.required<number>();
  width = input.required<number>();
  height = input.required<number>();
  x = input<number>(0);
  y = input<number>(0);

  LABELS_MARGIN_RIGHT = LABELS_MARGIN_RIGHT;

  stepLines = computed<number[]>(() => {
    const sep: number[] = [];
    const step = this.max() / LINES_COUNT;
    for (let i = 0; i < LINES_COUNT + 1; i++) {
      sep.push(step * (LINES_COUNT - i));
    }
    return sep;
  });

  scaleStep = computed(() => this.height() / LINES_COUNT);
}
