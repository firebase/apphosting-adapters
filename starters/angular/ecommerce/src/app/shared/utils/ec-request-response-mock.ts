import { MockFn } from '@ngx-templates/shared/fetch';
import Data from '../../../../public/mock-data/data.json';
import { ApiProduct } from '../../api/utils/api-types';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

/**
 * Returns mocked data based on a request URL
 *
 * @param url Request URL
 * @returns
 */
export const ecommerceRequestResponseMock: MockFn = (url: string): object => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any = {};
  const queryParamsStr = url.split('?').pop();

  // Filter by the provided query params, if any
  const queryParams: { [key: string]: string } = queryParamsStr
    ? queryParamsStr
        .split('&')
        .map((pair) => pair.split('='))
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
    : {};

  // PRODUCTS – Return a list of products
  if (/products\??[\w,=\-\\+&]*$/.test(url)) {
    // Do not return the complete data for a product
    let products = Data.products.map(
      (p) =>
        ({
          id: p.id,
          name: p.name,
          price: p.price,
          discount_price: p.discount_price,
          availability: p.availability,
          category_ids: p.category_ids,
          images: [p.images[0]],
        }) as ApiProduct,
    );

    // If batchIds is provided, the rest of the filters
    // are ignored
    if (queryParams['batchIds']) {
      products = queryParams['batchIds']
        .split(',')
        .map((id) => products.find((p) => p.id === id))
        .filter((p) => !!p) as ApiProduct[];

      return products;
    }

    // Filter by category
    if (queryParams['categoryId']) {
      products = products.filter((p) =>
        p.category_ids.includes(queryParams['categoryId']),
      );
    }

    // Filter by name
    if (queryParams['name']) {
      const param = queryParams['name'].toLowerCase().replace(/\+/g, '');
      products = products.filter((p) =>
        p.name.toLowerCase().replace(/\s/g, '').includes(param),
      );
    }

    // Filter by "from price"
    if (queryParams['fromPrice']) {
      const price = ~~queryParams['fromPrice'];

      products = products.filter((p) => {
        // Discount price has a priority, if it exists
        const productPrice = p.discount_price || p.price;
        return productPrice >= price;
      });
    }

    // Filter by "to price"
    if (queryParams['toPrice']) {
      const price = ~~queryParams['toPrice'];

      products = products.filter((p) => {
        // Discount price has a priority, if it exists
        const productPrice = p.discount_price || p.price;
        return productPrice <= price;
      });
    }

    // By default the products are sorted by date of creation.
    // Providing a "sortBy" param changes this.
    if (queryParams['sortBy']) {
      const sortBy = queryParams['sortBy'];

      switch (sortBy) {
        case 'price_asc':
          products.sort((a, b) => {
            const pA = a.discount_price || a.price;
            const pB = b.discount_price || b.price;
            return pA - pB;
          });
          break;

        case 'price_desc':
          products.sort((a, b) => {
            const pA = a.discount_price || a.price;
            const pB = b.discount_price || b.price;
            return pB - pA;
          });
          break;
      }
    }

    // Perform paging
    const page = ~~queryParams['page'] || DEFAULT_PAGE;
    const pageSize = ~~queryParams['pageSize'] || DEFAULT_PAGE_SIZE;
    const idx = (page - 1) * pageSize;

    products = products.slice(idx, idx + pageSize);

    response = products;
  }

  // PRODUCT – Return a single product (with complete data)
  if (/products\/[0-9]+/.test(url)) {
    const id = url.split('/').pop();
    response = Data.products.find((p) => p.id === id) || {};
  }

  // CATEGORIES – Return all categories
  if (url.endsWith('categories')) {
    response = Data.categories;
  }

  return response;
};
