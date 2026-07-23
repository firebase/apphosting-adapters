import { Routes } from '@angular/router';
import { RoutePrefix } from './route-prefixes';
import { BoardComponent } from './board/board.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: RoutePrefix.Home,
        component: BoardComponent,
      },
      {
        path: RoutePrefix.Card + '/:id',
        component: BoardComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
