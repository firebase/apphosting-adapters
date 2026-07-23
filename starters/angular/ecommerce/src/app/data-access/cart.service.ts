import {
  Injectable,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Map, Set } from 'immutable';
import { Product } from '../../models';
import { LocalStorage } from '@ngx-templates/shared/services';
import { ProductsApi } from '../api/products-api.service';
import { maxProductQuantity } from '../shared/utils/max-quantity';

const CART_LS_KEY = 'ec-cart';

/**
 * Cart state.
 */
@Injectable()
export class CartService {
  private _storage = inject(LocalStorage);
  private _productsApi = inject(ProductsApi);

  private _cart = signal<Map<string, number>>(Map([]));
  private _products = signal<Map<string, Product>>(Map([]));

  readonly products = computed(() =>
    this._products()
      .toList()
      .sortBy((p) => p.name),
  );

  readonly quantities = this._cart.asReadonly();

  readonly size = computed(() =>
    this._cart()
      .map((q) => q)
      .reduce((acc, curr) => acc + curr, 0),
  );

  readonly total = computed(() =>
    this._products()
      .map((p) => (this._cart().get(p.id) || 1) * (p.discountPrice || p.price))
      .toList()
      .reduce((p, c) => p + c, 0),
  );

  constructor() {
    // _loadCartInState uses browser API; hence, we need
    // to defer the execution after the SSR render.
    afterNextRender({ read: () => this._loadCartInState() });

    // Any update of the _cart signal after the _loadCartInState
    // will result in a Storage update.
    effect(() => {
      this._storage.setJSON(CART_LS_KEY, this._cart().toJSON());
    });
  }

  async loadCartProducts() {
    const missingFromState = this._cart()
      .filter((_, id) => !this._products().has(id))
      .toArray()
      .map(([key]) => key);

    // If there are missing products in the state,
    // load them.
    if (missingFromState.length) {
      const products = await this._productsApi.getProducts({
        batchIds: missingFromState,
      });

      for (const p of products) {
        this._products.update((m) => m.set(p.id, p));
      }

      // If there are products that don't exist
      // in the database anymore or are unavailable,
      // remove them from the local storage.
      const existingProductsSet = Set<string>(
        this._products()
          .toList()
          .filter((p) => p.availability !== 'none')
          .map((p) => p.id),
      );
      const nonExistentProducts = this._cart()
        .toArray()
        .filter(([id]) => !existingProductsSet.has(id));

      for (const [id] of nonExistentProducts) {
        this._cart.update((m) => m.delete(id));
      }
    }
  }

  addToCart(product: Product, quantity: number = 1) {
    this.updateQuantity(product, quantity);
  }

  updateQuantity(
    product: Product,
    quantity: number,
    relativeQuantity: boolean = true,
  ) {
    const currQuantity = relativeQuantity
      ? this._cart().get(product.id) || 0
      : 0;
    const maxQuantity = maxProductQuantity(product);
    const nextQuantity = Math.min(currQuantity + quantity, maxQuantity);

    if (!nextQuantity) {
      this.removeFromCart(product);
      return;
    }

    this._cart.update((m) => m.set(product.id, nextQuantity));

    if (!this._products().has(product.id)) {
      this._products.update((m) => m.set(product.id, product));
    }
  }

  removeFromCart(product: Product) {
    this._cart.update((m) => m.delete(product.id));
    this._products.update((m) => m.delete(product.id));
  }

  /**
   * Load cart products from the local storage
   * to the in-memory state.
   */
  private _loadCartInState() {
    const cart = this._storage.getJSON(CART_LS_KEY) as {
      [key: string]: number;
    } | null;

    if (cart) {
      for (const productId in cart) {
        const quantity = cart[productId];
        untracked(() => {
          this._cart.update((m) => m.set(productId, quantity));
        });
      }
    }
  }
}
