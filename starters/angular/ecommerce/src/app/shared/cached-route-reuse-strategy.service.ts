import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy,
} from '@angular/router';

const getReuseFromRoutes = (route: ActivatedRouteSnapshot): string[] =>
  route.routeConfig?.data ? route.routeConfig.data['reuseFrom'] || [] : [];

const getRoutePath = (route: ActivatedRouteSnapshot): string =>
  route.pathFromRoot
    .filter((r) => !!r.routeConfig)
    .map((r) => r.routeConfig!.path)
    .filter((s) => !!s)
    .join('/');

// The store key is represented by the route path.
const getStoreKey = (route: ActivatedRouteSnapshot) => getRoutePath(route);

// This custom strategy allows us to reuse/cache specific pages (components)
// when navigating away from them by providing a "reuseFrom" array to your
// route config path. "reuseFrom" paths tell the strategy to reuse the
// respective route (i.e. component) when navigating from any of the listed
// route paths in the array to the target route. Of course, the route will
// be reused only if it has been previously loaded in the cache.
//
// More details about the interface:
// https://github.com/angular/angular/blob/main/packages/router/src/route_reuse_strategy.ts#L80
@Injectable()
export class CachedRouteReuseStrategy implements RouteReuseStrategy {
  private _store: Map<string, DetachedRouteHandle> = new Map();
  private _newRoutePath: string = '';
  private _lastStoredPath: string | null = null;

  // Note that shouldDetach is called after shouldAttach on
  // route change; therefore, we are checking the new path.
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    const reuseFromRoutes = getReuseFromRoutes(route);
    const shouldReuse = reuseFromRoutes.includes(this._newRoutePath);

    return shouldReuse;
  }

  store(
    route: ActivatedRouteSnapshot,
    handle: DetachedRouteHandle | null,
  ): void {
    const key = getStoreKey(route);

    if (handle) {
      this._lastStoredPath = key;
      this._store.set(key, handle);
    } else {
      this._store.delete(key);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    this._newRoutePath = getRoutePath(route);

    return this._store.has(getStoreKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this._store.get(getStoreKey(route)) || null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot,
  ): boolean {
    const futurePath = getRoutePath(future);
    const currPath = getRoutePath(curr);
    const isRoot = futurePath === '' && currPath === '';

    // After caching a page, we expect to use it/restore it when
    // the user goes back. If they decide to move forward
    // in history however, the cache will no longer be valid
    // and will create a memory leak that could break further
    // navigation. This is why, we are cleaning the cached
    // page manually. Potentially, we could use constant memory
    // (O(1)) for the cache but the Map is more descriptive and
    // intuitive and has a key protection for any missed edge cases.
    if (
      !isRoot &&
      this._lastStoredPath !== null &&
      futurePath !== this._lastStoredPath
    ) {
      this._store.delete(this._lastStoredPath);
      this._lastStoredPath = null;
    }

    return future.routeConfig === curr.routeConfig;
  }
}
