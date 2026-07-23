import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  CTX_MENU_DATA,
  CtxMenuController,
} from '@ngx-templates/shared/context-menu';
import { ModalService } from '@ngx-templates/shared/modal';

import { ListsService } from '../../../data-access/lists.service';
import {
  ConfirmDeleteData,
  ConfirmDeleteModalComponent,
} from '../../confirm-delete-modal/confirm-delete-modal.component';

export type ListCtxMenuData = {
  listId: string;
};

@Component({
  selector: 'kb-list-ctx-menu',
  imports: [],
  templateUrl: './list-ctx-menu.component.html',
  styleUrl: './list-ctx-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListCtxMenuComponent {
  lists = inject(ListsService);
  private _data = inject<ListCtxMenuData>(CTX_MENU_DATA);
  private _ctrl = inject(CtxMenuController);
  private _modal = inject(ModalService);

  position = computed(() =>
    this.lists.value().findIndex((l) => l.id === this._data.listId),
  );

  moveList(dir: 'left' | 'right') {
    const pos = this.position();
    const newPos =
      dir === 'left'
        ? Math.max(0, pos - 1)
        : Math.min(pos + 1, this.lists.value().size);

    this.lists.updateListPosition(this._data.listId, newPos);

    this._ctrl.close();
  }

  deleteList() {
    this._modal
      .createModal<
        ConfirmDeleteData,
        boolean
      >(ConfirmDeleteModalComponent, { entity: 'list' })
      .closed.then((shouldDelete) => {
        if (shouldDelete) {
          this.lists.deleteList(this._data.listId);
        }
      });

    this._ctrl.close();
  }
}
