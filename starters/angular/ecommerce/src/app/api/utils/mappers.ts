import { List } from 'immutable';
import { Category, Product, ProductParameter } from '../../../models';
import { ApiCategory, ApiProduct } from './api-types';

// Mappers add an aditional layer between the API call and the state update.
// They convert the external API response types to the internal immutable models.

export const mapCategory = (c: ApiCategory): Category =>
  new Category({
    id: c.id,
    name: c.name,
    order: c.order,
  });

export const mapCategories = (categories: ApiCategory[]) =>
  List(categories.map((c) => mapCategory(c)));

export const mapProduct = (p: ApiProduct): Product =>
  new Product({
    id: p.id,
    name: p.name,
    description: p.description,
    categoryIds: List(p.category_ids),
    images: List(p.images),
    price: p.price,
    discountPrice: p.discount_price,
    availability: p.availability,
    parameters: List(
      (p.parameters || []).map(
        (pm) =>
          new ProductParameter({
            name: pm.name,
            value: pm.value,
          }),
      ),
    ),
  });

export const mapProducts = (products: ApiProduct[]): List<Product> =>
  List(products.map((p) => mapProduct(p)));
