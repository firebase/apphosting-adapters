import { Injectable, inject, signal } from '@angular/core';
import { Map } from 'immutable';
import { Product } from '../../models';
import { ProductsApi } from '../api/products-api.service';

/**
 * Products state.
 */
@Injectable()
export class ProductsService {
  private _productsApi = inject(ProductsApi);
  private _products = signal<Map<string, Product>>(Map([]));

  readonly value = this._products.asReadonly();

  async loadProduct(id: string) {
    const product = await this._productsApi.getProduct(id);

    // If the product doesn't exist, the Product object will be empty; hence, the ID.
    if (product.id) {
      this._products.update((map) => map.set(product.id, product));
    }
  }
}
