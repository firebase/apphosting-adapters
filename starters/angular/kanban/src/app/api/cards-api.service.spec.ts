import { TestBed } from '@angular/core/testing';
import { LocalStorage } from '@ngx-templates/shared/services';
import { FETCH_MOCK_STATE } from '@ngx-templates/shared/fetch';

import { fetchApiMockAndStateProvider } from '../shared/utils/fetch-mock-provider.test-util';
import { CardsApi } from './cards-api.service';
import { Card } from '../../models';
import { BoardsApi } from './boards-api.service';

const BOARD_ID = 'bd1';

// Relies on mocked data
describe('CardsApiService', () => {
  let cardsApi: CardsApi;
  let boardsApi: BoardsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        fetchApiMockAndStateProvider,
        BoardsApi,
        CardsApi,
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
    cardsApi = TestBed.inject(CardsApi);
    boardsApi = TestBed.inject(BoardsApi);
  });

  it('should fetch a card', async () => {
    const card = (await cardsApi.getCard('c1'))!;

    expect(card instanceof Card).toBeTruthy();
    expect(card.id).toEqual('c1');
  });

  it('should create a card', async () => {
    const card = new Card({
      title: 'New Card',
      listId: 'ls3',
    });
    const dbCard = (await cardsApi.createCard(card, true))!;

    expect(dbCard instanceof Card).toBeTruthy();
    expect(dbCard.id).toBeTruthy();
    expect(dbCard.title).toEqual('New Card');
    expect(dbCard.listId).toEqual('ls3');
    expect(dbCard.pos).toEqual(0);

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    expect(board.cards.has(dbCard.id)).toBeTrue();
  });

  it('should update a card', async () => {
    const card = (await cardsApi.updateCard('c2', {
      title: 'Card 2',
      description: 'TBD',
      labelIds: ['l1', 'l5'],
      listId: 'ls2',
      pos: 1,
    }))!;

    expect(card instanceof Card).toBeTruthy();
    expect(card.title).toEqual('Card 2');
    expect(card.description).toEqual('TBD');
    expect(card.labelIds.toArray()).toEqual(['l1', 'l5']);
    expect(card.listId).toEqual('ls2');
    expect(card.pos).toEqual(1);
  });

  it('should delete a card', async () => {
    await cardsApi.deleteCard('c3');

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    const exists = board.cards.has('c3');

    expect(exists).toBeFalse();
  });
});
