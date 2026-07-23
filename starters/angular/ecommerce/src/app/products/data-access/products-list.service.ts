import { Injectable, inject, signal } from '@angular/core';
import { List } from 'immutable';

import { GetProductsParams, ProductsApi } from '../../api/products-api.service';
import { Product } from '../../../models';
import { environment } from '../../../environments/environment';

/**
 * Products list state.
 */
@Injectable()
export class ProductsListService {
  private _productsApi = inject(ProductsApi);
  private _products = signal<List<Product>>(List([]));
  private _isComplete = signal<boolean>(false);
  private _isLoaded = signal<boolean>(false);
  private _isLoading = signal<'update' | 'reload' | 'no'>('no');

  private _lastOptions: GetProductsParams = {};

  readonly value = this._products.asReadonly();
  readonly isComplete = this._isComplete.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  async loadProducts(options?: GetProductsParams) {
    const optionsDiff = this._getOptionsDiff(options);
    const isUpdate =
      Object.keys(optionsDiff).length === 1 &&
      optionsDiff.page === (this._lastOptions.page || 0) + 1;

    // We want to differentiate between the
    // different types of loading
    this._isLoading.set(isUpdate ? 'update' : 'reload');

    const products = await this._productsApi.getProducts(options);
    this._isLoading.set('no');

    if (isUpdate) {
      // Updating products
      this._products.update((list) => list.concat(products));
    } else {
      // Reloading products
      this._products.set(products);
    }

    this._isLoaded.set(true);
    this._isComplete.set(products.size < environment.productsListPageSize);
    this._lastOptions = options || {};
  }

  private _getOptionsDiff(currOptions?: GetProductsParams): GetProductsParams {
    const diff: GetProductsParams = {};

    for (const prop in currOptions) {
      const castedProp = prop as keyof GetProductsParams;
      const currParam = currOptions[castedProp];
      const lastParam = this._lastOptions[castedProp];

      if (currParam !== lastParam) {
        diff[castedProp] = currParam as undefined;
      }
    }

    return diff;
  }
}
