import { RouterEvent } from '@angular/router';

/**
 * Get route path based on a router event
 *
 * @param event
 * @returns
 */
export const getRoutePath = (event?: RouterEvent): string => {
  if (!event) {
    return '';
  }

  return event.url
    .split('/')
    .map((seg) => {
      const qParamsIdx = seg.indexOf('?');
      return qParamsIdx > -1 ? seg.substring(0, qParamsIdx) : seg;
    })
    .filter((seg) => !!seg)
    .join('/');
};

/**
 * Checks whether the rout is product details page
 *
 * @param event
 * @returns
 */
export const isProductDetailsRoute = (event?: RouterEvent) =>
  /products\/\d+/.test(getRoutePath(event));
