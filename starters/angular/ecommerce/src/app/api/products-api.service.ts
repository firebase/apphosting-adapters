import { Injectable, inject } from '@angular/core';
import { List } from 'immutable';
import { FETCH_API, fetchAbort } from '@ngx-templates/shared/fetch';
import { buildQueryParamsString } from '@ngx-templates/shared/utils';

import { Product } from '../../models';
import { environment } from '../../environments/environment';
import { mapProduct, mapProducts } from './utils/mappers';

export type GetProductsParams = Partial<{
  categoryId: string;
  pageSize: number;
  page: number;
  name: string;
  sortBy: 'price_asc' | 'price_desc';
  fromPrice: number;
  toPrice: number;
  batchIds: string[];
}>;

// NOTE: An error handling mechanism is not implemented.
@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private _abortIfInProgress = fetchAbort();
  private _fetch = inject(FETCH_API);

  /**
   * Fetches products
   *
   * @returns A products list that matches the given criteria
   */
  async getProducts(
    params?: GetProductsParams,
    abortIfInProgress: boolean = true,
  ): Promise<List<Product>> {
    const signal = abortIfInProgress
      ? this._abortIfInProgress(this.getProducts.name)
      : null;
    const queryParams = buildQueryParamsString({
      pageSize: environment.productsListPageSize,
      ...params,
    } as GetProductsParams);

    const response = await this._fetch(
      `${environment.apiUrl}/products${queryParams}`,
      {
        signal,
      },
    ).catch(() => {}); // Handle aborted requests

    const json = response?.ok ? await response.json() : [];

    return mapProducts(json);
  }

  /**
   * Fetches the complete data of a product
   *
   * @param id
   * @returns A product
   */
  async getProduct(id: string): Promise<Product> {
    const signal = this._abortIfInProgress(this.getProduct.name);
    const response = await this._fetch(`${environment.apiUrl}/products/${id}`, {
      signal,
    }).catch(() => {}); // Handle aborted requests

    const json = response?.ok ? await response.json() : {};

    return mapProduct(json);
  }
}
