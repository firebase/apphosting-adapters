import { Signal, Type } from '@angular/core';
import { List, Record } from 'immutable';

/**
 * Represents one of the three supported data source types.
 */
export enum DataSourceType {
  SingleValued = 'SingleValued',
  List = 'List',
  Tabular = 'Tabular',
}

// Data item immutable object
interface DataItemConfig {
  label: string;
  value: number;
  unit: string;
}

const dataItemRecord = Record<DataItemConfig>({
  label: '',
  value: 0,
  unit: '',
});

export class DataItem extends dataItemRecord {
  constructor(config: Partial<DataItemConfig>) {
    super(config);
  }
}

// Tabular data immutable object
interface TabularDataConfig {
  unit: string;
  rows: List<TabularDataRow>;
  colLabels: List<string>;
}

const tabularDataRecord = Record<TabularDataConfig>({
  unit: '',
  rows: List(),
  colLabels: List(),
});

export class TabularData extends tabularDataRecord {
  constructor(config: Partial<TabularDataConfig>) {
    super(config);
  }
}

// Tabular data row immutable object (Part of `TabularData`)
interface TabularDataRowConfig {
  label: string;
  values: List<number>;
}

const tabularDataRowRecord = Record<TabularDataRowConfig>({
  label: '',
  values: List(),
});

export class TabularDataRow extends tabularDataRowRecord {
  constructor(config: Partial<TabularDataRowConfig>) {
    super(config);
  }
}

export type DataType = DataItem | List<DataItem> | TabularData;

// Definition type
export type DataSourceDefinition = {
  id: string;
  name: string;
  type: DataSourceType;
  useClass: Type<unknown>;
};

/**
 * Defines the interface of a data source service.
 * Implement, if you need to create your own data source.
 * Then, define it in the `DATA_SOURCES` array.
 */
export interface DataSource<T extends DataType> {
  /**
   * Data signal consumed by the widget.
   */
  data: Signal<T>;

  /**
   * Initialization method called every time a widget
   * that uses the data source is rendered.
   */
  init: () => void;
}
