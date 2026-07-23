import { Injectable, signal } from '@angular/core';
import { DataItem, DataSource } from '../types';
import { List } from 'immutable';

const SALES: [string, number][] = [
  ['Merchandise', 3213],
  ['Phones', 1233],
  ['Personal Computers', 233],
  ['Cameras', 502],
  ['Smart Watches', 2142],
  ['Printers', 99],
  ['Other', 1421],
];

@Injectable()
export class SalesList implements DataSource<List<DataItem>> {
  private _init = false;
  private _data = signal<List<DataItem>>(List());
  data = this._data.asReadonly();

  init() {
    if (this._init) {
      return;
    }

    this._init = true;

    setTimeout(() => {
      const list = List(
        SALES.map(
          ([category, count]) =>
            new DataItem({ label: category, value: count, unit: 'items' }),
        ),
      );
      this._data.set(list);
    });
  }
}
