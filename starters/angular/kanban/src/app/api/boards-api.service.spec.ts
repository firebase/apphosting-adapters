import { TestBed } from '@angular/core/testing';
import { LocalStorage } from '@ngx-templates/shared/services';
import { FETCH_MOCK_STATE } from '@ngx-templates/shared/fetch';

import { BoardsApi } from './boards-api.service';
import { fetchApiMockAndStateProvider } from '../shared/utils/fetch-mock-provider.test-util';
import { Board, BoardList, Label } from '../../models';

const BOARD_ID = 'bd1';

// Relies on mocked data
describe('BoardsApiService', () => {
  let boardsApi: BoardsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        fetchApiMockAndStateProvider,
        BoardsApi,
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
    boardsApi = TestBed.inject(BoardsApi);
  });

  it('should fetch a board', async () => {
    const board = (await boardsApi.getBoardData(BOARD_ID))!;

    expect(board instanceof Board).toBeTruthy();
    expect(board.id).toEqual(BOARD_ID);
  });

  it('should create a list', async () => {
    const list = new BoardList({
      name: 'List',
    });
    const dbList = (await boardsApi.createBoardList(BOARD_ID, list))!;

    expect(dbList instanceof BoardList).toBeTruthy();
    expect(dbList.id).toBeTruthy();
    expect(dbList.boardId).toEqual(BOARD_ID);
    expect(dbList.name).toEqual('List');
  });

  it('should update list name', async () => {
    const list = (await boardsApi.updateBoardList(BOARD_ID, 'ls1', {
      name: 'Updated Name',
    }))!;

    expect(list instanceof BoardList).toBeTruthy();

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    const exists = !!board.lists.find(
      (l) => l.id === 'ls1' && l.name === 'Updated Name',
    );

    expect(exists).toBeTrue();
  });

  it('should update list position', async () => {
    const list = (await boardsApi.updateBoardList(BOARD_ID, 'ls2', {
      pos: 0,
    }))!;
    expect(list instanceof BoardList).toBeTruthy();

    const board = (await boardsApi.getBoardData(BOARD_ID))!;

    expect(board.lists.get(0)!.id === 'ls2').toBeTrue();
  });

  it('should delete a list', async () => {
    await boardsApi.deleteBoardList(BOARD_ID, 'ls3');

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    const exists = !!board.lists.find((l) => l.id === 'ls3');

    expect(exists).toBeFalse();
  });

  it('should delete a list', async () => {
    await boardsApi.deleteBoardList(BOARD_ID, 'ls3');

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    const exists = !!board.lists.find((l) => l.id === 'ls3');

    expect(exists).toBeFalse();
  });

  it('should delete a list', async () => {
    await boardsApi.deleteBoardList(BOARD_ID, 'ls3');

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    const exists = !!board.lists.find((l) => l.id === 'ls3');

    expect(exists).toBeFalse();
  });

  it('should create a label', async () => {
    const label = new Label({
      name: 'Docs',
      color: 'blue',
    });
    const dbLabel = (await boardsApi.createLabel(BOARD_ID, label))!;

    expect(dbLabel instanceof Label).toBeTruthy();
    expect(dbLabel.id).toBeTruthy();
    expect(dbLabel.name).toEqual('Docs');
    expect(dbLabel.color).toEqual('blue');
  });

  it('should update a label', async () => {
    const label = (await boardsApi.updateLabel(BOARD_ID, 'l1', {
      name: 'Priority 1',
      color: 'purple',
    }))!;

    expect(label instanceof Label).toBeTruthy();

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    const bLabel = board.labels.get('l1');

    expect(bLabel?.name).toEqual('Priority 1');
    expect(bLabel?.color).toEqual('purple');
  });

  it('should delete a label', async () => {
    await boardsApi.deleteLabel(BOARD_ID, 'l2');

    const board = (await boardsApi.getBoardData(BOARD_ID))!;
    const exists = board.labels.has('l2');

    expect(exists).toBeFalse();
  });
});
