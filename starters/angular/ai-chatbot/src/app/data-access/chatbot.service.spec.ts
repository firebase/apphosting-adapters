import { TestBed } from '@angular/core/testing';
import { FETCH_MOCK_STATE } from '@ngx-templates/shared/fetch';

import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';
import { ChatbotService } from './chatbot.service';

const epoch = new Date(0);

// Relies on mocked data
describe('ChatbotService', () => {
  let chatbotService: ChatbotService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        fetchApiMockProvider,
        ChatbotService,
        {
          provide: FETCH_MOCK_STATE,
          useValue: {
            state: {
              chats: {
                c1: {
                  id: 'c1',
                  name: 'Chat 1',
                  totalQueries: 1,
                  createdAt: epoch,
                  updatedAt: new Date(1),
                  queries: [
                    {
                      id: 'q1',
                      message: 'Message 1',
                      response: 'Response 1',
                      createdAt: epoch,
                    },
                    {
                      id: 'q2',
                      message: 'Message 2',
                      response: 'Response 2',
                      createdAt: epoch,
                    },
                  ],
                },
                c2: {
                  id: 'c2',
                  name: 'Chat 2',
                  totalQueries: 0,
                  createdAt: epoch,
                  updatedAt: new Date(2),
                  queries: [],
                },
              },
            },
          },
        },
      ],
    });

    chatbotService = TestBed.inject(ChatbotService);
  });

  it('should create a chat', async () => {
    await chatbotService.createChat('Create chat');

    expect(chatbotService.chats().size).toEqual(1);
    expect(chatbotService.chats().first()?.queries.first()?.message).toEqual(
      'Create chat',
    );
  });

  it('should load chats', async () => {
    await chatbotService.loadChats();

    expect(chatbotService.chats().size).toEqual(2);
  });

  it('should load chat queries', async () => {
    await chatbotService.loadChats();
    await chatbotService.loadChatQueries('c1');

    expect(chatbotService.chats().get('c1')?.queries.size).toEqual(2);

    expect(
      chatbotService
        .sortedChats()
        .toArray()
        .map((c) => c.name),
    ).toEqual(['Chat 2', 'Chat 1']);
  });

  it('should send a query', async () => {
    await chatbotService.loadChats();
    await chatbotService.sendQuery('c2', 'Message 3');

    const chat = chatbotService.chats().get('c2');
    expect(chat?.queries.size).toEqual(1);
    expect(chat?.queries.first()?.message).toEqual('Message 3');
  });

  it('should delete a chat', async () => {
    await chatbotService.deleteChat('c1');
    await chatbotService.loadChats();

    expect(chatbotService.chats().has('c1')).toBeFalse();
  });
});
