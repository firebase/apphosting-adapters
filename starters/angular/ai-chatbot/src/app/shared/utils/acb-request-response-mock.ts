import { Injector } from '@angular/core';
import { FETCH_MOCK_STATE, MockFn } from '@ngx-templates/shared/fetch';
import { LocalStorage } from '@ngx-templates/shared/services';
import { generateShortUUID } from '@ngx-templates/shared/utils';

import { GeminiApi } from './gemini-api';
import { environment } from '../../../environments/environment';

const DEFAULT_PAGE_SIZE = 15;
const DEFAULT_PAGE = 1;
const STORE_KEY = 'acb-dev-db';

type Chat = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  totalQueries: number;
  queries: {
    id: string;
    message: string;
    response: string;
    createdAt: string;
  }[];
};

type MockStore = {
  chats: { [key: string]: Chat };
};

const DefaultState: MockStore = {
  chats: {},
};

/**
 * Returns mocked data based on a request URL
 *
 * @param url Request URL
 * @returns
 */
export const acbRequestResponseMock: MockFn = async (
  url: string,
  method: string,
  body: { [key: string]: string | number } | null,
  injector: Injector,
): Promise<object> => {
  const store = injector.get<{ state: MockStore | null }>(
    FETCH_MOCK_STATE,
    undefined,
    { optional: true },
  );
  const ls = injector.get(LocalStorage);
  const gemini = injector.get(GeminiApi);

  if (!store) {
    throw new Error(
      '[CHAT FETCH MOCK] The mock uses Fetch state. Please provide it via `provideFetchMockState()` in your app config.',
    );
  }

  // Define store manipulation functions
  const getStore = (): MockStore => {
    if (!store.state) {
      const data = ls.getJSON(STORE_KEY) as MockStore;
      store.state = data || DefaultState;
    }
    return store.state!;
  };
  const updateStore = (updater: (s: MockStore) => MockStore) => {
    store.state = updater(structuredClone(getStore()));
    ls.setJSON(STORE_KEY, store.state);
  };

  const routeParams = url
    .replace(environment.apiUrl + '/', '')
    .replace(/\?.*$/, '')
    .split('/');
  const resource = routeParams[0];

  // GET /chats
  const handleChatsGet = () =>
    Object.entries(getStore().chats)
      .map(([_, c]) => ({
        id: c.id,
        name: c.name,
        totalQueries: c.queries.length,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

  // POST /chats
  const handleChatsPost = async () => {
    const createdDt = new Date().toISOString();
    const message = (body as { message: string })['message'];

    // Gemini API
    const name = await gemini.generateChatName(message);
    const response = await gemini.generateQueryResponse(message);

    const chat = {
      id: generateShortUUID(),
      name,
      createdAt: createdDt,
      updatedAt: createdDt,
      totalQueries: 1,
      queries: [
        {
          id: generateShortUUID(),
          message,
          response,
          createdAt: createdDt,
        },
      ],
    };

    updateStore((s) => {
      s.chats[chat.id] = chat;
      return s;
    });

    return chat;
  };

  // DELETE /chats/{id}
  const handleChatsDelete = (chatId: string) => {
    updateStore((s) => {
      delete s.chats[chatId];
      return s;
    });
  };

  // GET /chats/{id}/queries
  const handleQueriesGet = (chatId: string) => {
    const queryParamsStr = url.split('?')[1];
    const queryParams: { [key: string]: string } = queryParamsStr
      ? queryParamsStr
          .split('&')
          .map((pair) => pair.split('='))
          .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
      : {};

    const pageSize = ~~queryParams['pageSize'] || DEFAULT_PAGE_SIZE;
    const page = ~~queryParams['page'] || DEFAULT_PAGE;
    const idx = (page - 1) * pageSize;

    return getStore().chats[chatId]?.queries.slice(idx, idx + pageSize);
  };

  // POST /chats/{id}/queries
  const handleQueriesPost = async (chatId: string) => {
    const message = (body as { message: string })['message'];

    // Gemini API
    const response = await gemini.generateQueryResponse(message);

    const created = new Date().toISOString();

    const query = {
      id: generateShortUUID(),
      message,
      response,
      createdAt: created,
    };

    updateStore((s) => {
      const chat = s.chats[chatId];
      chat.queries.unshift(query);
      chat.updatedAt = created;
      return s;
    });

    return query;
  };

  // Resource: /chats
  const resourceChats = async () => {
    const [, chatId, secondaryResource] = routeParams;

    if (!secondaryResource) {
      switch (method) {
        case 'GET':
          return handleChatsGet();
        case 'POST':
          return await handleChatsPost();
        case 'DELETE':
          return handleChatsDelete(chatId);
      }
    }

    if (secondaryResource === 'queries') {
      switch (method) {
        case 'GET':
          return handleQueriesGet(chatId);
        case 'POST':
          return await handleQueriesPost(chatId);
      }
    }

    return {};
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: any = {};

  if (resource === 'chats') {
    response = await resourceChats();
  }

  return response;
};
