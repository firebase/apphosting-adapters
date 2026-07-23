import { computed, inject, Injectable, Signal } from '@angular/core';
import { List, Map as ImmutMap } from 'immutable';

import { BOARD_STATE } from './board-state.provider';
import { Card } from '../../../models';
import { CardsApi } from '../../api/cards-api.service';

@Injectable()
export class CardsService {
  private _board = inject(BOARD_STATE);
  private _cardsApi = inject(CardsApi);

  private _computedCardsLists = new Map<string, Signal<List<Card>>>();

  value = computed(() => this._board().cards);

  fromList = (listId: string): Signal<List<Card>> => {
    let computedList = this._computedCardsLists.get(listId);

    if (!computedList) {
      // Note(Georgi): No need to sort. The drop-grid does that internally.
      computedList = computed(() =>
        this._board()
          .cards.filter((c) => c.listId === listId)
          .toList(),
      );
      this._computedCardsLists.set(listId, computedList);
    }

    return computedList;
  };

  async loadCard(cardId: string) {
    const dbCard = await this._cardsApi.getCard(cardId);

    if (dbCard) {
      this._board.update((b) => b.set('cards', b.cards.set(dbCard.id, dbCard)));
    }

    return dbCard;
  }

  async createCard(listId: string, title: string, insertOnTop?: boolean) {
    const card = new Card({
      listId,
      title,
    });

    const dbCard = await this._cardsApi.createCard(card, insertOnTop);

    if (!dbCard) {
      return;
    }

    this._board.update((b) => {
      if (insertOnTop) {
        const listCards = b.cards
          .filter((c) => c.listId === listId)
          .map((c) => c.set('pos', c.pos + 1));

        b = b.set('cards', b.cards.concat(listCards));
      }

      return b.set('cards', b.cards.set(dbCard.id, dbCard));
    });
  }

  async updateCardPosition(
    cardId: string,
    changes: { pos: number; listId?: string },
  ) {
    const oldCard = this.value().get(cardId)!;
    // Case I. No change; No need for request. new pos = old pos
    if (oldCard?.pos === changes.pos && oldCard.listId === changes.listId) {
      return;
    }

    const newCard = await this._cardsApi.updateCard(cardId, changes);
    if (!newCard) {
      return;
    }

    // Note(Georgi): We can spare ourselves from all those
    // calculations by providing the output of affected items
    // from the drop grid moved event. However, this will make
    // the usage of the method more restrictive.
    this._board.update((b) => {
      let cards = b.cards;
      const oldPos = oldCard.pos;
      const newPos = newCard.pos;

      if (oldCard.listId === newCard.listId) {
        const listCards = cards.filter((c) => c.listId === oldCard.listId);
        let updated: ImmutMap<string, Card>;

        // Case II. new pos > old pos
        if (newPos > oldPos) {
          updated = listCards
            .filter((c) => oldPos < c.pos && c.pos <= newPos)
            .map((c) => c.set('pos', c.pos - 1));
        } else {
          // Case III. old pos > new pos
          updated = listCards
            .filter((c) => newPos <= c.pos && c.pos < oldPos)
            .map((c) => c.set('pos', c.pos + 1));
        }
        cards = cards.concat(updated);
      } else {
        // Case IV. List change
        const oldListUpdatedPos = b.cards
          .filter((c) => c.listId === oldCard.listId && c.pos > oldPos)
          .map((c) => c.set('pos', c.pos - 1));
        const newListUpdatedPos = b.cards
          .filter((c) => c.listId === newCard.listId && c.pos >= newPos)
          .map((c) => c.set('pos', c.pos + 1));

        cards = cards.concat(oldListUpdatedPos).concat(newListUpdatedPos);
      }

      cards = cards.set(newCard.id, newCard);

      return b.set('cards', cards);
    });
  }

  async updateCardContent(
    cardId: string,
    content: { title?: string; description?: string; labelIds?: string[] },
  ) {
    const dbCard = await this._cardsApi.updateCard(cardId, content);

    if (dbCard) {
      this._board.update((b) => {
        return b.set('cards', b.cards.set(dbCard.id, dbCard));
      });
    }
  }

  async deleteCard(cardId: string) {
    await this._cardsApi.deleteCard(cardId);

    this._board.update((b) => b.set('cards', b.cards.remove(cardId)));
  }
}
