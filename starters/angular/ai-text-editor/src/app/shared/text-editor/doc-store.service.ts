import { inject, Injectable, signal } from '@angular/core';
import { LocalStorage } from '@ngx-templates/shared/services';

const DOC_STORE_LS_KEY = 'ate-doc';

/**
 * Provides an API for storing and managing the
 * document contents in within the local storage.
 */
@Injectable()
export class DocStoreService {
  private _storage = inject(LocalStorage);

  private _source?: HTMLElement;
  private _html = signal<string>('');
  html = this._html.asReadonly();

  constructor() {
    const content = this._storage.get(DOC_STORE_LS_KEY) || '';
    this._html.set(content);
  }

  provideSource(source: HTMLElement) {
    this._source = source;
  }

  save() {
    if (!this._source) {
      return;
    }

    const content = this._source.innerHTML;
    this._storage.set(DOC_STORE_LS_KEY, content);
    this._html.set(content);
  }

  clear() {
    this._html.set('');
    this._storage.remove(DOC_STORE_LS_KEY);
  }
}
