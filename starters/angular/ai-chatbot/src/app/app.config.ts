import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { provideWindow } from '@ngx-templates/shared/services';
import {
  provideFetchApi,
  provideFetchMockState,
  withFetchMock,
} from '@ngx-templates/shared/fetch';
import { APP_ROUTES } from './app.routes';

import { acbRequestResponseMock } from './shared/utils/acb-request-response-mock';
import { provideGeminiApi } from './shared/utils/gemini-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    provideRouter(APP_ROUTES),
    provideWindow(),
    // Drop the `withFetchMock` implementation argument along with
    // `provideGeminiApi` and `provideFetchMockState` in order to
    // perform actual network requests via the native Fetch
    // to your own API (set URL in /environments).
    //
    // Keep in mind that the Fetch mock can perform actual
    // Gemini API calls internally (Check server.ts for the API).
    // In essence: App => Fetch mock => Gemini API (mocked or real).
    //
    // Currently set to `false`, i.e. perform calls to Gemini
    provideGeminiApi({ mockedData: false }),
    provideFetchMockState(),
    provideFetchApi(withFetchMock(acbRequestResponseMock)),
  ],
};
