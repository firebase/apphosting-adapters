import { withFetchMock, provideFetchApi } from '@ngx-templates/shared/fetch';
import { ecommerceRequestResponseMock } from './ec-request-response-mock';

// Used for testing
export const fetchApiMockProvider = provideFetchApi(
  withFetchMock(ecommerceRequestResponseMock, {
    logging: false,
    responseDelay: 0,
  }),
);
