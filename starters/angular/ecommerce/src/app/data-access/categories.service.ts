import { Injectable, computed, inject, signal } from '@angular/core';
import { Map } from 'immutable';
import { Category } from '../../models';
import { CategoriesApi } from '../api/categories-api.service';

/**
 * Categories state.
 */
@Injectable()
export class CategoriesService {
  private _categoriesApi = inject(CategoriesApi);
  private _categories = signal<Map<string, Category>>(Map([]));

  readonly value = this._categories.asReadonly();

  // Computed
  readonly categoriesList = computed(() =>
    this._categories()
      .toList()
      .sort((a, b) => a.order - b.order),
  );

  async loadCategories() {
    if (this._categories().size) {
      return;
    }

    const categories = await this._categoriesApi.getCategories();

    let map = Map<string, Category>([]);
    categories.forEach((c: Category) => {
      map = map.set(c.id, c);
    });

    this._categories.set(map);
  }
}
