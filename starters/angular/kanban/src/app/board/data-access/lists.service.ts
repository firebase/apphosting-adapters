import { computed, inject, Injectable } from '@angular/core';
import { BOARD_STATE } from './board-state.provider';
import { BoardList } from '../../../models';
import { BoardsApi } from '../../api/boards-api.service';

@Injectable()
export class ListsService {
  private _board = inject(BOARD_STATE);
  private _boardsApi = inject(BoardsApi);

  value = computed(() => this._board().lists);

  async createList(name: string) {
    const list = new BoardList({
      name,
      boardId: this._board().id,
    });

    const dbList = await this._boardsApi.createBoardList(
      this._board().id,
      list,
    );

    if (dbList) {
      this._board.update((b) => b.set('lists', b.lists.push(dbList)));
    }
  }

  async updateListName(listId: string, name: string) {
    const dbLabel = await this._boardsApi.updateBoardList(
      this._board().id,
      listId,
      { name },
    );

    if (dbLabel) {
      this._board.update((b) => {
        const idx = b.lists.findIndex((l) => l.id === listId);
        return b.set('lists', b.lists.set(idx, dbLabel));
      });
    }
  }

  async updateListPosition(listId: string, pos: number) {
    const dbLabel = await this._boardsApi.updateBoardList(
      this._board().id,
      listId,
      { pos },
    );

    if (dbLabel) {
      this._board.update((b) => {
        const idx = b.lists.findIndex((l) => l.id === listId);
        const lists = b.lists.remove(idx).insert(pos, dbLabel);
        return b.set('lists', lists);
      });
    }
  }

  async deleteList(listId: string) {
    await this._boardsApi.deleteBoardList(this._board().id, listId);

    this._board.update((b) => {
      const listIdx = b.lists.findIndex((l) => l.id === listId);
      const updatedLists = b.lists.remove(listIdx);
      const updatedCards = b.cards.filter((c) => c.listId !== listId);

      return b.set('lists', updatedLists).set('cards', updatedCards);
    });
  }
}
