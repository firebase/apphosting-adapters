import { Injectable, signal } from '@angular/core';
import { List } from 'immutable';

import { DataSource, TabularData, TabularDataRow } from '../types';

const NEW_USERS: [string, number[]][] = [
  ['Americas', [200, 350, 120, 40, 120, 323, 670]],
  ['Europe', [122, 654, 202, 754, 100, 50, 252]],
  ['Western Pacific', [812, 380, 900, 400, 1000, 430, 150]],
  ['Africa', [542, 264, 550, 1204, 423, 211, 50]],
];

@Injectable()
export class NewUsersTable implements DataSource<TabularData> {
  private _init = false;
  private _data = signal<TabularData>(new TabularData({}));
  data = this._data.asReadonly();

  init() {
    if (this._init) {
      return;
    }

    this._init = true;

    setTimeout(() => {
      const table = new TabularData({
        unit: 'users',
        colLabels: List([
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ]),
        rows: List(
          NEW_USERS.map(
            ([continent, traffic]) =>
              new TabularDataRow({
                label: continent,
                values: List(traffic),
              }),
          ),
        ),
      });

      this._data.set(table);
    });
  }
}
