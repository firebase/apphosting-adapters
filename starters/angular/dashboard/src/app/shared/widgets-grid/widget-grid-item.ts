import { Record } from 'immutable';
import { WidgetConfig, WidgetType } from '../widgets/widget';

export interface WidgetGridItemConfig {
  id: string;
  position: number;
  type: WidgetType;
  config: WidgetConfig;
  dataSourceId: string;
  size: number;
  title: string;
}

const widgetGridItemRecord = Record<WidgetGridItemConfig>({
  id: '',
  position: 0,
  type: 'scalar-data',
  config: null,
  dataSourceId: '',
  size: 1,
  title: '',
});

export class WidgetGridItem extends widgetGridItemRecord {
  constructor(config: Partial<WidgetGridItemConfig>) {
    super(config);
  }
}
