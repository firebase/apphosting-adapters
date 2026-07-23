import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { WidgetType } from '../../widgets/widget';

const WIDGET_NAMES: { [key in WidgetType]: string } = {
  'bar-chart': 'Bar Chart',
  'line-chart': 'Line Chart',
  'pie-chart': 'Pie Chart',
  table: 'Table',
  'scalar-data': 'Scalar Data',
};

@Component({
  selector: 'db-widget-item',
  imports: [],
  templateUrl: './widget-item.component.html',
  styleUrl: './widget-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetItemComponent {
  type = input.required<WidgetType>();
  widgetName = computed(() => WIDGET_NAMES[this.type()]);
  widgetClick = output<WidgetType>();
}
