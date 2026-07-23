import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideWindow } from '@ngx-templates/shared/services';
import { withFetchMock, provideFetchApi } from '@ngx-templates/shared/fetch';
import { geminiApiMock } from './shared/utils/gemini-api-mock';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideClientHydration(),
    provideWindow(),
    // Drop the `withFetchMock` implementation argument in order to
    // perform actual network requests via the native Fetch API.
    provideFetchApi(withFetchMock(geminiApiMock, { responseDelay: 2000 })),
  ],
};
