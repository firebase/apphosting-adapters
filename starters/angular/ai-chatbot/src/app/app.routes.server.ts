import { RenderMode, ServerRoute } from '@angular/ssr';
import { RoutePrefix } from './route-prefixes';

export const serverRoutes: ServerRoute[] = [
  {
    path: RoutePrefix.Home,
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
