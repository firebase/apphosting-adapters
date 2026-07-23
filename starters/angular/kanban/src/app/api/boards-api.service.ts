import { Injectable, inject } from '@angular/core';
import { FETCH_API } from '@ngx-templates/shared/fetch';

import { mapBoardList, mapLabel, mapBoard } from './utils/internal-mappers';
import { environment } from '../../environments/environment';
import { Board, BoardList, Label } from '../../models';
import {
  mapApiRequestBoardList,
  mapApiRequestLabel,
} from './utils/external-mappers';
import { Response } from './utils/types';

@Injectable({ providedIn: 'root' })
export class BoardsApi {
  private _fetch = inject(FETCH_API);

  async getBoardData(boardId: string): Response<Board> {
    const response = await this._fetch(
      `${environment.apiUrl}/boards/${boardId}`,
    );
    const json = await response.json();

    return mapBoard(json);
  }

  // Lists

  async createBoardList(boardId: string, list: BoardList): Response<BoardList> {
    const response = await this._fetch(
      `${environment.apiUrl}/boards/${boardId}/lists`,
      {
        method: 'POST',
        body: JSON.stringify(mapApiRequestBoardList(list)),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const json = await response.json();

    return mapBoardList(json);
  }

  async updateBoardList(
    boardId: string,
    listId: string,
    changes: { name?: string; pos?: number },
  ): Response<BoardList> {
    const response = await this._fetch(
      `${environment.apiUrl}/boards/${boardId}/lists/${listId}`,
      {
        method: 'PUT',
        body: JSON.stringify(changes),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const json = await response.json();

    return mapBoardList(json);
  }

  async deleteBoardList(boardId: string, listId: string): Response<void> {
    await this._fetch(
      `${environment.apiUrl}/boards/${boardId}/lists/${listId}`,
      {
        method: 'DELETE',
      },
    );
  }

  // Labels

  async createLabel(boardId: string, label: Label): Response<Label> {
    const response = await this._fetch(
      `${environment.apiUrl}/boards/${boardId}/labels`,
      {
        method: 'POST',
        body: JSON.stringify(mapApiRequestLabel(label)),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const json = await response.json();

    return mapLabel(json);
  }

  async updateLabel(
    boardId: string,
    labelId: string,
    changes: { name?: string; color?: string },
  ): Response<Label> {
    const response = await this._fetch(
      `${environment.apiUrl}/boards/${boardId}/labels/${labelId}`,
      {
        method: 'PUT',
        body: JSON.stringify(changes),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const json = await response.json();

    return mapLabel(json);
  }

  async deleteLabel(boardId: string, labelId: string): Response<void> {
    await this._fetch(
      `${environment.apiUrl}/boards/${boardId}/labels/${labelId}`,
      {
        method: 'DELETE',
      },
    );
  }
}
