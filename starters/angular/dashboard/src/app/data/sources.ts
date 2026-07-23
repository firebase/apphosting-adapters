import { DataSourceDefinition, DataSourceType } from './types';

import { TrafficIntensity } from './sources/traffic-intensity.data-source';
import { NewUsersTable } from './sources/new-users-table.data-source';
import { UsersNationalityList } from './sources/users-nationality-list.data-source';
import { SalesList } from './sources/sales-list.data-source';

// Data sources available for use by the widgets that support the specific type(s).
//
// The currently used sources serve mocked data for demo purposes.
// Drop before going prod.
export const DATA_SOURCES: DataSourceDefinition[] = [
  {
    id: 'traffic-intensity',
    name: 'Traffic',
    type: DataSourceType.SingleValued,
    useClass: TrafficIntensity,
  },
  {
    id: 'users-nationality-list',
    name: 'Users Nationality',
    type: DataSourceType.List,
    useClass: UsersNationalityList,
  },
  {
    id: 'new-users-table',
    name: 'New Users',
    type: DataSourceType.Tabular,
    useClass: NewUsersTable,
  },
  {
    id: 'sales-list',
    name: 'Sales',
    type: DataSourceType.List,
    useClass: SalesList,
  },
  // Add a new data source definition here ...
];
