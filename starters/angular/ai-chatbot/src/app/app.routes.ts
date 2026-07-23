import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { RoutePrefix } from './route-prefixes';

export const APP_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: RoutePrefix.Home,
        component: ChatComponent,
      },
      {
        path: RoutePrefix.Chat + '/:id',
        component: ChatComponent,
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
