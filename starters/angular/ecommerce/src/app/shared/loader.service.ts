import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  loader = signal<boolean>(false);

  showLoader() {
    this.loader.set(true);
  }

  hideLoader() {
    this.loader.set(false);
  }
}
