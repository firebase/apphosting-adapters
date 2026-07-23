import { InputSignal } from '@angular/core';

export type WidgetType =
  | 'bar-chart'
  | 'line-chart'
  | 'pie-chart'
  | 'table'
  | 'scalar-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WidgetConfig = any;

export interface Widget<T extends WidgetConfig, U> {
  config: InputSignal<T>;
  data: InputSignal<U>;
}
