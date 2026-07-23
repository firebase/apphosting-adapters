import { Routes } from '@angular/router';
import { RoutePrefix } from './route-prefixes';
import { HomeComponent } from './home/home.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: RoutePrefix.Home,
        pathMatch: 'full',
        component: HomeComponent,
        data: {
          // We want to reuse the HomeComponent when navigating back from product details.
          // See CachedRouteReuseStrategy for more details.
          reuseFrom: [RoutePrefix.Products + '/:id/:slug'],
        },
      },
      {
        path: RoutePrefix.Products,
        loadChildren: () =>
          import('./products/products.routes').then((rt) => rt.PRODUCTS_ROUTES),
      },
      {
        path: RoutePrefix.Cart,
        loadComponent: () =>
          import('./cart/cart.component').then((cmp) => cmp.CartComponent),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
