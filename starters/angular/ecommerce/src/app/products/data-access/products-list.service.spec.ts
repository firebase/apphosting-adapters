import { TestBed } from '@angular/core/testing';
import { ProductsListService } from './products-list.service';
import { Product } from '../../../models';
import { fetchApiMockProvider } from '../../shared/utils/fetch-mock-provider.test-util';

const getPrice = (p: Product | undefined): number =>
  p?.discountPrice || p?.price || 0;

describe('ProductsListService', () => {
  let productsList: ProductsListService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [fetchApiMockProvider, ProductsListService],
    });

    productsList = TestBed.inject(ProductsListService);
  });

  it('should load a page from a category', async () => {
    await productsList.loadProducts({
      page: 1,
      pageSize: 4,
      categoryId: 'tech',
    });

    expect(
      productsList
        .value()
        .map((p) => p.categoryIds.find((c) => c === 'tech'))
        .filter((pCat) => !!pCat).size,
    ).toEqual(4);
  });

  it('should load multiple pages from a category', async () => {
    await productsList.loadProducts({
      page: 1,
      pageSize: 4,
      categoryId: 'tech',
    });
    await productsList.loadProducts({
      page: 2,
      pageSize: 4,
      categoryId: 'tech',
    });

    expect(
      productsList
        .value()
        .map((p) => p.categoryIds.find((c) => c === 'tech'))
        .filter((pCat) => !!pCat).size,
    ).toEqual(8);
  });

  it('should mark completed when all products are loaded', async () => {
    await productsList.loadProducts();

    expect(productsList.isComplete()).toBeFalse();

    await productsList.loadProducts({
      name: 'no_such_name_in_the_list',
    });

    expect(productsList.isComplete()).toBeTrue();
  });

  it('should filter products by name', async () => {
    await productsList.loadProducts({
      name: 'angular',
    });

    expect(
      productsList
        .value()
        .map((p) => p.name.toLowerCase().includes('angular'))
        .reduce((p, c) => p && c, true),
    ).toBeTrue();
  });

  it('should sort products by price (asc)', async () => {
    await productsList.loadProducts({
      categoryId: 'merch',
      sortBy: 'price_asc',
    });

    const products = productsList.value();

    let increasing = true;
    let last = getPrice(products.get(0));

    for (let i = 1; i < products.size; i++) {
      const curr = getPrice(products.get(i));

      if (last > curr) {
        increasing = false;
        break;
      }
      last = curr;
    }

    expect(increasing).toBeTrue();
  });

  it('should sort products by price (desc)', async () => {
    await productsList.loadProducts({
      categoryId: 'merch',
      sortBy: 'price_desc',
    });

    const products = productsList.value();

    let decreasing = true;
    let last = getPrice(products.get(0));

    for (let i = 1; i < products.size; i++) {
      const curr = getPrice(products.get(i));

      if (last < curr) {
        decreasing = false;
        break;
      }
      last = curr;
    }

    expect(decreasing).toBeTrue();
  });

  it('should filter products by price', async () => {
    await productsList.loadProducts({
      fromPrice: 100,
      toPrice: 200,
    });

    expect(
      productsList
        .value()
        .map((p) => 100 <= getPrice(p) && getPrice(p) <= 200)
        .reduce((p, c) => p && c, true),
    ).toBeTrue();
  });
});
