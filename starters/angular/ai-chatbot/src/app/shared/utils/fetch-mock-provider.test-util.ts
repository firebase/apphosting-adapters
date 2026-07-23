import {
  withFetchMock,
  provideFetchApi,
  provideFetchMockState,
} from '@ngx-templates/shared/fetch';
import { provideGeminiApi } from './gemini-api';
import { acbRequestResponseMock } from './acb-request-response-mock';

// Used for testing
export const fetchApiMockProvider = [
  provideGeminiApi({ mockedData: true, delay: 0 }),
  provideFetchMockState(),
  provideFetchApi(
    withFetchMock(acbRequestResponseMock, {
      logging: false,
      responseDelay: 0,
    }),
  ),
];
