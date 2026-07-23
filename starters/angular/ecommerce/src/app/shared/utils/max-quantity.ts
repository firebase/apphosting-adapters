import { Product } from '../../../models';

type Availability = Product['availability'];

const AVAILABILITY_MAX_RESTRICTION: { [key in Availability]: number } = {
  ['normal']: 50,
  ['low']: 10,
  ['none']: 0,
};

/**
 * Limits the purchasable quanitity of a product.
 *
 * @param p
 * @returns
 */
export const maxProductQuantity = (p: Product) =>
  AVAILABILITY_MAX_RESTRICTION[p.availability];
