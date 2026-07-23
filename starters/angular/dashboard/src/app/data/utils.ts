import { Injector } from '@angular/core';
import { DATA_SOURCES } from './sources';
import { DataSource, DataSourceDefinition, DataType } from './types';

const dsMap = new Map<string, DataSourceDefinition>(
  DATA_SOURCES.map((src) => [src.id, src]),
);

export const injectDataSourceInstance = <T extends DataType>(
  id: string,
  injector: Injector,
): DataSource<T> | null => {
  const src = dsMap.get(id);
  if (!src) {
    return null;
  }
  return injector.get(src.useClass) as DataSource<T>;
};

export const provideDataSources = () => DATA_SOURCES.map((src) => src.useClass);
