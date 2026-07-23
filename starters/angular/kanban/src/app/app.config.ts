import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
// import { provideClientHydration } from '@angular/platform-browser';
import {
  withFetchMock,
  provideFetchApi,
  provideFetchMockState,
} from '@ngx-templates/shared/fetch';

import { APP_ROUTES } from './app.routes';
import { kanbanRequestResponseMock } from './shared/utils/kb-request-response-mock';
import { provideWindow } from '@ngx-templates/shared/services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(APP_ROUTES),
    provideWindow(),
    // Drop the `withFetchMock` implementation argument, along with
    // `provideFetchMockState`, in order to perform actual network
    // requests via the native Fetch API.
    provideFetchMockState(),
    provideFetchApi(withFetchMock(kanbanRequestResponseMock)),
    // Second part of the comment: https://github.com/angular/angular/issues/51157#issuecomment-1648664873
    // provideClientHydration(),
  ],
};
