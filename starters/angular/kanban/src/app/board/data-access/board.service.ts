import { effect, inject, Injectable } from '@angular/core';

import { BoardsApi } from '../../api/boards-api.service';
import { BOARD_STATE } from './board-state.provider';

const BOARD_ID = 'bd1';

@Injectable()
export class BoardService {
  private _board = inject(BOARD_STATE);
  private _boardsApi = inject(BoardsApi);

  async loadBoardData() {
    const board = await this._boardsApi.getBoardData(BOARD_ID);
    if (board) {
      this._board.set(board);
    }
  }

  constructor() {
    // Debug
    // effect(() => {
    //   const debug = this._board()
    //     .lists.map((l) =>
    //       this._board()
    //         .cards.filter((c) => c.listId === l.id)
    //         .toList()
    //         .sort((a, b) => a.pos - b.pos)
    //         .map((c) => `[${c.pos}] ${c.title}`)
    //         .toJS(),
    //     )
    //     .filter((c) => !!c.length)
    //     .toJS();
    //   console.log(debug);
    // });
  }
}
