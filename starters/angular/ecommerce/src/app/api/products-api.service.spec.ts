import { TestBed } from '@angular/core/testing';
import { Product } from '../../models';
import { ProductsApi } from './products-api.service';
import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';

describe('ProductsApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [fetchApiMockProvider, ProductsApi],
    });
  });

  it('should fetch a single product', async () => {
    const productsApi = TestBed.inject(ProductsApi);
    const product = await productsApi.getProduct('6631');

    expect(product instanceof Product).toBeTruthy();
    expect(product.id).toEqual('6631');
  });

  it('should fetch multiple products', async () => {
    const productsApi = TestBed.inject(ProductsApi);
    const products = await productsApi.getProducts({
      pageSize: 4,
      page: 1,
    });

    expect(products.map((p) => p instanceof Product)).toBeTruthy();
    expect(products.size).toEqual(4);
  });
});
