import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { CtxMenuService } from '@ngx-templates/shared/context-menu';
import { IconComponent } from '@ngx-templates/shared/icon';

import { BoardList } from '../../../../models';
import { NewCardInputComponent } from './new-card-input/new-card-input.component';
import { CardsService } from '../../data-access/cards.service';
import { ListsService } from '../../data-access/lists.service';
import {
  ListCtxMenuComponent,
  ListCtxMenuData,
} from './list-ctx-menu/list-ctx-menu.component';
import { InteractiveTitleComponent } from '../interactive-title/interactive-title.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'kb-list',
  imports: [NewCardInputComponent, InteractiveTitleComponent, IconComponent],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListComponent {
  private _cards = inject(CardsService);
  private _lists = inject(ListsService);
  private _ctxMenu = inject(CtxMenuService);
  private _injector = inject(Injector);

  env = environment;

  list = input.required<BoardList>();
  cardCreatorEnabled = output<boolean>();

  cardCreator = signal<'top' | 'bottom' | 'none'>('none');

  isListEmpty = computed(
    () => !this._cards.value().find((c) => c.listId === this.list().id),
  );

  constructor() {
    effect(() => {
      const creatorEnabled = this.cardCreator() !== 'none';
      this.cardCreatorEnabled.emit(creatorEnabled);
    });
  }

  createCard(title: string, insertOnTop?: boolean) {
    this._cards.createCard(this.list().id, title, insertOnTop);
  }

  updateName(name: string) {
    if (name !== this.list().name) {
      this._lists.updateListName(this.list().id, name);
    }
  }

  openCtxMenu(e: MouseEvent) {
    this._ctxMenu.openMenu<ListCtxMenuData>(
      ListCtxMenuComponent,
      e,
      { listId: this.list().id },
      { injector: this._injector },
    );
  }
}
