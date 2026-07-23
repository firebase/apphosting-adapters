import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  Signal,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { IconComponent } from '@ngx-templates/shared/icon';
import { WidgetConfig, WidgetType } from './widget';
import { injectDataSourceInstance } from '../../data/utils';
import { DataType } from '../../data/types';
import { DATA_SOURCES } from '../../data/sources';
import { BarChartComponent } from './bar-chart/bar-chart.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';
import { TableComponent } from './table/table.component';
import { ScalarDataComponent } from './scalar-data/scalar-data.component';

@Component({
  selector: 'db-widget',
  imports: [
    IconComponent,
    BarChartComponent,
    LineChartComponent,
    PieChartComponent,
    TableComponent,
    ScalarDataComponent,
  ],
  templateUrl: './widget.component.html',
  styleUrl: './widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetComponent implements OnInit {
  private _injector = inject(Injector);

  type = input.required<WidgetType>();
  dataSourceId = input<string>();
  size = input<number>(1);
  config = input<WidgetConfig>();
  title = input<string>();
  editMode = input<boolean>(false);
  previewData = input<DataType>();

  remove = output<void>();

  data?: Signal<DataType>;

  displayedTitle = computed(
    () =>
      this.title() ||
      DATA_SOURCES.find((ds) => ds.id === this.dataSourceId())?.name,
  );

  ngOnInit() {
    const id = this.dataSourceId();
    if (!id) {
      return;
    }

    const srcInstance = injectDataSourceInstance(id, this._injector);
    if (srcInstance) {
      this.data = srcInstance.data;

      // The data source is initialized every time
      // a widget is initialized.
      srcInstance.init();
    }
  }
}
