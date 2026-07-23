import { TestBed } from '@angular/core/testing';
import { ProductsService } from './products.service';
import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';

describe('ProductsService', () => {
  let productsService: ProductsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [fetchApiMockProvider, ProductsService],
    });

    productsService = TestBed.inject(ProductsService);
  });

  it('should load a product', async () => {
    await productsService.loadProduct('6631');

    expect(productsService.value().size).toEqual(1);
    expect(productsService.value().first()?.id).toEqual('6631');
  });
});
