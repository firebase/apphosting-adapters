import { computed, inject, Injectable } from '@angular/core';
import { BOARD_STATE } from './board-state.provider';
import { BoardsApi } from '../../api/boards-api.service';
import { Label } from '../../../models';

@Injectable()
export class LabelsService {
  private _board = inject(BOARD_STATE);
  private _boardsApi = inject(BoardsApi);

  value = computed(() => this._board().labels);

  async createLabel(name: string, color: string) {
    const label = new Label({
      name,
      color,
    });
    const dbLabel = await this._boardsApi.createLabel(this._board().id, label);

    if (dbLabel) {
      this._board.update((b) =>
        b.set('labels', b.labels.set(dbLabel.id, dbLabel)),
      );
    }
  }

  async updateLabel(
    labelId: string,
    changes: { name?: string; color?: string },
  ) {
    const dbLabel = await this._boardsApi.updateLabel(
      this._board().id,
      labelId,
      changes,
    );

    if (dbLabel) {
      this._board.update((b) =>
        b.set('labels', b.labels.set(dbLabel.id, dbLabel)),
      );
    }
  }

  async deleteLabel(labelId: string) {
    await this._boardsApi.deleteLabel(this._board().id, labelId);

    this._board.update((b) => {
      const updatedCards = b.cards.map((c) =>
        c.set('labelIds', c.labelIds.delete(labelId)),
      );
      const updatedLabels = b.labels.remove(labelId);

      return b.set('cards', updatedCards).set('labels', updatedLabels);
    });
  }
}
