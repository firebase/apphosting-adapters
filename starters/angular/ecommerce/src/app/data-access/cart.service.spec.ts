import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CartService } from './cart.service';
import { Product } from '../../models';
import { LocalStorage } from '@ngx-templates/shared/services';
import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';

const lsMockProvider: Provider = {
  provide: LocalStorage,
  useValue: {
    getJSON: () => {
      return {
        ['6631']: 3,
      };
    },
    setJSON: () => {},
  },
};

describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [fetchApiMockProvider, lsMockProvider, CartService],
    });
    cartService = TestBed.inject(CartService);
  });

  it('should load items into the cart', async () => {
    // We need to call the private method manually since it's wrapper
    // in afterNextRender
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cartService as any)._loadCartInState();

    await cartService.loadCartProducts();
    expect(cartService.quantities().get('6631')).toEqual(3);
  });

  it('should add a single product to the cart', () => {
    cartService.addToCart(new Product({ id: '1337' }));

    expect(cartService.products().size).toEqual(1);
    expect(cartService.products().first()?.id).toEqual('1337');
  });

  it('should multiple products to the cart', () => {
    cartService.addToCart(new Product({ id: '1337' }));
    cartService.addToCart(new Product({ id: '42' }));

    expect(cartService.products().size).toEqual(2);
  });

  it('should remove a product from the cart', () => {
    const product = new Product({ id: '1337' });

    cartService.addToCart(product);

    expect(cartService.products().size).toEqual(1);

    cartService.removeFromCart(product);

    expect(cartService.products().size).toEqual(0);
  });

  it("should update product's absolute quantity", () => {
    const product = new Product({ id: '1337' });

    cartService.addToCart(product);

    expect(cartService.quantities().get('1337')).toEqual(1);

    cartService.updateQuantity(product, 42, false);

    expect(cartService.quantities().get('1337')).toEqual(42);
  });

  it("should update product's relative quantity", () => {
    const product = new Product({ id: '1337' });

    cartService.addToCart(product);

    expect(cartService.quantities().get('1337')).toEqual(1);

    cartService.updateQuantity(product, 9);

    expect(cartService.quantities().get('1337')).toEqual(10);
  });
});
