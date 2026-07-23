import { TestBed } from '@angular/core/testing';
import { LocalStorage } from '@ngx-templates/shared/services';
import { FETCH_MOCK_STATE } from '@ngx-templates/shared/fetch';

import { ChatbotApi } from './chatbot-api.service';
import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';

// Relies on mocked data
describe('ChatbotApiService', () => {
  let chatbotApi: ChatbotApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        fetchApiMockProvider,
        ChatbotApi,
        // Our mock relies on LS and FETCH_MOCK_STATE. In
        // order to avoid any side effects, we are
        // providing a dummies
        {
          provide: LocalStorage,
          useValue: {
            getJSON: () => undefined,
            setJSON: () => {},
          },
        },
        {
          provide: FETCH_MOCK_STATE,
          useValue: { state: null },
        },
      ],
    });
    chatbotApi = TestBed.inject(ChatbotApi);
  });

  it('should create a chat', async () => {
    const chat = (await chatbotApi.createChat('First chat message'))!;

    expect(chat.id).toBeTruthy();
    expect(chat.name).toBeTruthy();
    expect(chat.queries.size).toEqual(1);

    const query = chat.queries.first();

    expect(query?.message).toEqual('First chat message');
    expect(query?.response).toBeTruthy();
  });

  it('should get chats', async () => {
    await chatbotApi.createChat('Chat message 1');
    await chatbotApi.createChat('Chat message 2');

    const chats = (await chatbotApi.getChats())!;

    expect(chats.size).toEqual(2);
    expect(chats.first()?.queries.size).toEqual(0);
  });

  it('should send a chat query', async () => {
    const chat = (await chatbotApi.createChat('First chat message'))!;
    const query = (await chatbotApi.sendQuery(chat.id, 'Second message'))!;

    expect(query.response).toBeTruthy();
  });

  it('should get sorted chat queries', async () => {
    const chat = (await chatbotApi.createChat('First chat message'))!;
    await chatbotApi.sendQuery(chat.id, 'Second message');
    await chatbotApi.sendQuery(chat.id, 'Third message');

    const queries = await chatbotApi.getChatQueries(chat.id, {
      pageSize: 10,
      page: 1,
    });

    expect(queries.size).toEqual(3);
    expect(queries.toArray().map((q) => q.message)).toEqual([
      'Third message',
      'Second message',
      'First chat message',
    ]);
  });

  it('should page chat queries', async () => {
    const chat = (await chatbotApi.createChat('First chat message'))!;
    await chatbotApi.sendQuery(chat.id, 'Second message');
    await chatbotApi.sendQuery(chat.id, 'Third message');

    const queries = await chatbotApi.getChatQueries(chat.id, {
      pageSize: 1,
      page: 3,
    });

    expect(queries.size).toEqual(1);
    expect(queries.first()?.message).toEqual('First chat message');
  });

  it('should delete a chat', async () => {
    const chat = (await chatbotApi.createChat('First chat message'))!;
    expect(chat).toBeTruthy();

    await chatbotApi.deleteChat(chat.id);

    const chats = await chatbotApi.getChats();

    expect(chats.size).toEqual(0);
  });
});
