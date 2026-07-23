import { inject } from '@angular/core';
import { ProductsService } from '../../data-access/products.service';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';
import { LoaderService } from '../../shared/loader.service';

const FALLBACK_ROUTE = '/products';

/**
 * Product details route guard – attempt loading the product by the ID param
 */
export const canActivateProductDetails: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
): Promise<boolean | UrlTree> => {
  const products = inject(ProductsService);
  const loader = inject(LoaderService);
  const router = inject(Router);

  const id = route.paramMap.get('id');

  if (!id) {
    return router.parseUrl(FALLBACK_ROUTE);
  }

  // If the product is not in the state,
  // perform an API call.
  if (!products.value().has(id)) {
    loader.showLoader();
    await products.loadProduct(id);
    loader.hideLoader();

    // Check again if the ID exists after the request.
    if (!products.value().has(id)) {
      return router.parseUrl(FALLBACK_ROUTE);
    }
    return true;
  }

  return true;
};
