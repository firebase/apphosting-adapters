import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  SimpleChanges,
  computed,
  input,
  signal,
} from '@angular/core';
import { IconComponent } from '@ngx-templates/shared/icon';

import { Widget } from '../widget';
import { DataItem } from '../../../data/types';
import { FormatThousandsPipe } from '../../pipes/format-thousands.pipe';
import { WidgetTooltipDirective } from '../widget-tooltip/widget-tooltip.directive';

export type ScalarDataConfig = void;

@Component({
  selector: 'db-scalar-data',
  imports: [FormatThousandsPipe, WidgetTooltipDirective, IconComponent],
  templateUrl: './scalar-data.component.html',
  styleUrl: './scalar-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScalarDataComponent
  implements Widget<ScalarDataConfig, DataItem>, OnChanges
{
  data = input.required<DataItem>();
  config = input<ScalarDataConfig>();
  prevData = signal<DataItem | undefined>(undefined);

  // Calculates whether there is positive, negative
  // or neutral change based on the previous data item.
  change = computed(() => {
    const prevData = this.prevData();
    return prevData ? this.data().value - prevData.value : 0;
  });

  ngOnChanges(changes: SimpleChanges) {
    this.prevData.set(changes['data'].previousValue);
  }
}
