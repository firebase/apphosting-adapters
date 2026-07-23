import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { WINDOW } from '@ngx-templates/shared/services';
import { isPlatformBrowser } from '@angular/common';

/**
 * Manage scroll Y/top.
 * Provide separately for each component-page.
 */
@Injectable()
export class ScrollPosition {
  private _platformId = inject(PLATFORM_ID);
  private _win = inject(WINDOW);
  private _scrollY: number = 0;

  private get _isBrowser() {
    return isPlatformBrowser(this._platformId);
  }

  save() {
    if (this._isBrowser) {
      this._scrollY = this._win.scrollY;
    }
  }

  apply() {
    if (this._isBrowser) {
      this._win.scrollTo({ top: this._scrollY });
    }
  }

  reset() {
    if (this._isBrowser) {
      this._scrollY = 0;
      this._win.scrollTo({ top: 0 });
    }
  }
}
