import { inject, Injectable } from '@angular/core';
import { FETCH_API } from '@ngx-templates/shared/fetch';

import { Card } from '../../models';
import { environment } from '../../environments/environment';
import { mapCard } from './utils/internal-mappers';
import { mapApiRequestCard } from './utils/external-mappers';
import { Response } from './utils/types';

// Unlike, lists and label – that have direct relation
// with the board – cards rely on the their relation with
// lists. This, in turn, means that cards have a transitive
// relation with boards; therefore, we have a simplified API
// that's separated from the Boards API.

@Injectable({ providedIn: 'root' })
export class CardsApi {
  private _fetch = inject(FETCH_API);

  async getCard(cardId: string): Promise<Card> {
    const response = await this._fetch(`${environment.apiUrl}/cards/${cardId}`);
    const json = await response.json();

    return mapCard(json);
  }

  async createCard(card: Card, insertOnTop = false): Response<Card> {
    const response = await this._fetch(`${environment.apiUrl}/cards`, {
      method: 'POST',
      body: JSON.stringify({
        card: mapApiRequestCard(card),
        insertOnTop,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json();

    return mapCard(json);
  }

  async updateCard(
    cardId: string,
    changes: {
      pos?: number;
      listId?: string;
      title?: string;
      description?: string;
      labelIds?: string[];
    },
  ): Response<Card> {
    const response = await this._fetch(
      `${environment.apiUrl}/cards/${cardId}`,
      {
        method: 'PUT',
        body: JSON.stringify(changes),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const json = await response.json();

    return mapCard(json);
  }

  async deleteCard(cardId: string): Response<void> {
    await this._fetch(`${environment.apiUrl}/cards/${cardId}`, {
      method: 'DELETE',
    });
  }
}
