import { Injector, effect, inject } from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterEvent,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollPosition } from '../scroll-position.service';

/**
 * Use in combination with the `ScrollPosition` service. You must
 * provide the `ScrollPosition` service in the target component/page.
 *
 * Automatically apply the last saved scroll position when coming back
 * from a specified exit route.
 *
 * Requires an injection context!
 *
 * @param injector
 * @param exitRouteTest
 */
export const maintainScrollPosEffect = (
  exitRouteTest: (e?: RouterEvent) => boolean,
  injector?: Injector,
) => {
  const router = inject(Router);
  const scrollPos = inject(ScrollPosition);
  const routerEvents = toSignal(router.events);
  let lastEvent: NavigationEnd;

  effect(
    () => {
      const event = routerEvents();

      if (event instanceof NavigationStart) {
        // Opening the exit route – save current scroll
        if (exitRouteTest(event)) {
          scrollPos.save();
        }
      }

      if (event instanceof NavigationEnd) {
        // Coming back from the exit route – apply stored scroll
        if (exitRouteTest(lastEvent)) {
          scrollPos.apply();
        }

        lastEvent = event;
      }
    },
    injector ? { injector } : undefined,
  );
};
