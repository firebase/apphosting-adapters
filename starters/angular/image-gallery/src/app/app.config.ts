import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideWindow } from '@ngx-templates/shared/services';
import { withFetchMock, provideFetchApi } from '@ngx-templates/shared/fetch';
import { APP_ROUTES } from './app.routes';
import { imgGalleryRequestResponseMock } from './shared/utils/ig-request-response-mock';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    // Drop the `withFetchMock` implementation argument in order to
    // perform actual network requests via the native Fetch API.
    provideFetchApi(withFetchMock(imgGalleryRequestResponseMock)),
    provideWindow(),
  ],
};
