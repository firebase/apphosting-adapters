import { Injectable, signal } from '@angular/core';
import { DataItem, DataSource } from '../types';

@Injectable()
export class TrafficIntensity implements DataSource<DataItem> {
  private _init = false;
  private _data = signal<DataItem>(
    new DataItem({
      unit: 'users/m',
      value: Math.round(Math.random() * 10000),
      label: 'Users',
    }),
  );
  data = this._data.asReadonly();

  init() {
    if (this._init) {
      return;
    }

    this._init = true;

    setInterval(() => {
      let change = Math.random() > 0.5 ? 1 : -1;
      change = Math.random() < 0.5 ? change : 0;
      if (change !== 0) {
        change *= Math.round(Math.random() * 100);
      }

      const d = this._data();
      const newData = new DataItem({
        label: d.label,
        unit: d.unit,
        value: d.value + change,
      });

      this._data.set(newData);
    }, 2000);
  }
}
