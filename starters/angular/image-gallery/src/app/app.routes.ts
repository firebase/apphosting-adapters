import { Routes } from '@angular/router';
import { RoutePrefix } from './route-prefixes';
import { GalleryComponent } from './gallery/gallery.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: RoutePrefix.Home,
        component: GalleryComponent,
      },
      {
        path: RoutePrefix.Image + '/:idx',
        component: GalleryComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
