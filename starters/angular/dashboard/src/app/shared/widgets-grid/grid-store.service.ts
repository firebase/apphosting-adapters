import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { LocalStorage } from '@ngx-templates/shared/services';
import { Map } from 'immutable';
import { WidgetGridItem, WidgetGridItemConfig } from './widget-grid-item';
import { isPlatformBrowser } from '@angular/common';

const GRID_CONFIG_LS_KEY = 'db-grid-cfg';

// Default demo widgets.
// Feel free to delete them in your app.
const DEFAULT_LIST: WidgetGridItemConfig[] = [
  {
    id: 'bc',
    position: 0,
    type: 'bar-chart',
    config: {},
    dataSourceId: 'users-nationality-list',
    title: 'Users Nationality',
    size: 2,
  },
  {
    id: 'lc',
    position: 1,
    type: 'line-chart',
    config: {},
    dataSourceId: 'new-users-table',
    title: 'New Users',
    size: 2,
  },
  {
    id: 'pc',
    position: 2,
    type: 'pie-chart',
    config: {},
    dataSourceId: 'sales-list',
    title: 'Sales (per category)',
    size: 1,
  },
  {
    id: 'tb',
    position: 3,
    type: 'table',
    config: {},
    dataSourceId: 'new-users-table',
    title: 'New Users (detailed)',
    size: 2,
  },
  {
    id: 'sv',
    position: 4,
    type: 'scalar-data',
    config: {},
    dataSourceId: 'traffic-intensity',
    title: 'Traffic',
    size: 1,
  },
];

/**
 * Preserves the state of the dashboard/widget grid
 * (i.e. types of widgets and their positions).
 */
@Injectable()
export class GridStoreService {
  private _storage = inject(LocalStorage);
  private _platformId = inject(PLATFORM_ID);

  getGridItems(): Map<string, WidgetGridItem> {
    // Return an empty list on the server.
    // Else, it will return the DEFAULT_LIST which will
    // be visible for a brief moment when loading the page
    // in the browser.
    if (!isPlatformBrowser(this._platformId)) {
      return Map([]);
    }

    const items = this._storage.getJSON(GRID_CONFIG_LS_KEY);

    if (items && items instanceof Array) {
      return Map(items.map((i) => [i.id, new WidgetGridItem(i)]));
    }

    // Return the default list, if the storage is empty
    return Map(DEFAULT_LIST.map((i) => [i.id, new WidgetGridItem(i)]));
  }

  setGridItems(items: Map<string, WidgetGridItem>) {
    const obj = items
      .toList()
      .toJSON()
      .map((o) => o.toJSON());

    this._storage.set(GRID_CONFIG_LS_KEY, JSON.stringify(obj));
  }
}
