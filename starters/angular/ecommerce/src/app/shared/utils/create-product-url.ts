import { Product } from '../../../models';
import { RoutePrefix } from '../../route-prefixes';

/**
 * Create a Product URL (Angular route array).
 *
 * @param p Product
 * @returns An Angular route
 */
export const createProductUrl = (p: Product): string[] => [
  '/',
  RoutePrefix.Products,
  p.id,
  p.name
    .toLowerCase()
    .replace(/[^\w\s.]/g, '')
    .replace(/\s/g, '-'),
];
