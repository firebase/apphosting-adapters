import { withFetchMock, provideFetchApi } from '@ngx-templates/shared/fetch';
import { kanbanRequestResponseMock } from './kb-request-response-mock';
import { provideBoardState } from '../../board/data-access/board-state.provider';

// Used for testing
export const fetchApiMockAndStateProvider = [
  provideFetchApi(
    withFetchMock(kanbanRequestResponseMock, {
      logging: false,
      responseDelay: 0,
    }),
  ),
  provideBoardState(),
];
