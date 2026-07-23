import { List } from 'immutable';
import {
  DataItem,
  DataSourceType,
  DataType,
  TabularData,
  TabularDataRow,
} from '../../data/types';
import { WidgetConfig, WidgetType } from '../widgets/widget';

export type WidgetStoreItem = {
  type: WidgetType;
  demoConfig: WidgetConfig;
  previewData: DataType;
  supportedSizes: number[];
  supportedDataSource: DataSourceType;
};

/**
 * List of available widgets to add to the dashboard.
 */
export const STORE_WIDGETS: WidgetStoreItem[] = [
  {
    type: 'bar-chart',
    demoConfig: {},
    previewData: List([
      new DataItem({ value: 1 }),
      new DataItem({ value: 3 }),
      new DataItem({ value: 2 }),
      new DataItem({ value: 0.5 }),
    ]),
    supportedSizes: [2, 3, 4],
    supportedDataSource: DataSourceType.List,
  },
  {
    type: 'line-chart',
    demoConfig: {},
    previewData: new TabularData({
      rows: List([
        new TabularDataRow({ values: List([10, 30, 20, 45, 50]) }),
        new TabularDataRow({ values: List([45, 50, 15, 20, 5]) }),
        new TabularDataRow({ values: List([25, 25, 30, 25, 45]) }),
      ]),
      colLabels: List(['', '', '', '', '']),
    }),
    supportedSizes: [2, 3, 4],
    supportedDataSource: DataSourceType.Tabular,
  },
  {
    type: 'pie-chart',
    demoConfig: {},
    previewData: List([
      new DataItem({ value: 0.25 }),
      new DataItem({ value: 0.15 }),
      new DataItem({ value: 0.4 }),
      new DataItem({ value: 0.1 }),
      new DataItem({ value: 0.1 }),
    ]),
    supportedSizes: [1],
    supportedDataSource: DataSourceType.List,
  },
  {
    type: 'table',
    demoConfig: {},
    previewData: new TabularData({
      rows: List([
        new TabularDataRow({ values: List([10, 20, 30, 35]), label: 'i' }),
        new TabularDataRow({ values: List([5, 30, 10, 15]), label: 'ii' }),
        new TabularDataRow({ values: List([25, 10, 0, 0]), label: 'iii' }),
        new TabularDataRow({ values: List([10, 14, 50, 0]), label: 'iv' }),
        new TabularDataRow({ values: List([25, 1, 0, 10]), label: 'v' }),
        new TabularDataRow({ values: List([25, 10, 0, 30]), label: 'vi' }),
        new TabularDataRow({ values: List([25, 5, 55, 10]), label: 'vii' }),
        new TabularDataRow({ values: List([25, 10, 0, 0]), label: 'viii' }),
      ]),
      colLabels: List(['A', 'B', 'C', 'D']),
    }),
    supportedSizes: [2, 3, 4],
    supportedDataSource: DataSourceType.Tabular,
  },
  {
    type: 'scalar-data',
    demoConfig: {},
    previewData: new DataItem({ label: 'Bandwidth', value: 42, unit: 'GB' }),
    supportedSizes: [1],
    supportedDataSource: DataSourceType.SingleValued,
  },
];
