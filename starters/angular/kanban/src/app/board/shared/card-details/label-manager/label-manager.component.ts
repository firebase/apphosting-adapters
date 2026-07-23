import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  Signal,
} from '@angular/core';
import {
  CTX_MENU_DATA,
  CtxMenuController,
} from '@ngx-templates/shared/context-menu';
import { ButtonComponent } from '@ngx-templates/shared/button';
import { IconComponent } from '@ngx-templates/shared/icon';
import { Set } from 'immutable';

import { LabelFormComponent } from './label-form/label-form.component';
import { LabelsService } from '../../../data-access/labels.service';
import { Label } from '../../../../../models';
import { CardsService } from '../../../data-access/cards.service';
import { LabelColoringDirective } from '../../label-coloring/label-coloring.directive';

export type LabelManagerData = {
  cardId: string;
  cardLabelsIds: Signal<Set<string>>;
};

type Mode = 'card-labels' | 'creator' | 'editor' | 'delete-label-confirmation';

@Component({
  selector: 'kb-label-manager',
  imports: [
    LabelFormComponent,
    ButtonComponent,
    LabelColoringDirective,
    IconComponent,
  ],
  templateUrl: './label-manager.component.html',
  styleUrl: './label-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelManagerComponent {
  data = inject<LabelManagerData>(CTX_MENU_DATA);
  private _ctrl = inject(CtxMenuController);
  private _labels = inject(LabelsService);
  private _cards = inject(CardsService);

  filteredLabels = computed(() =>
    this._labels
      .value()
      .filter(
        (l) =>
          !this.data.cardLabelsIds().has(l.id) &&
          l.name.toLowerCase().includes(this._labelFilter()),
      )
      .toList()
      .sort(),
  );

  addedLabels = computed(() =>
    this._labels
      .value()
      .filter((l) => this.data.cardLabelsIds().has(l.id))
      .toList()
      .sort(),
  );

  mode = signal<Mode>('card-labels');
  editedLabel = signal<Label | null>(null);

  private _labelFilter = signal<string>('');

  addLabel(label: Label) {
    const id = this.data.cardId;
    const currentCardLabels = this._cards.value().get(id)!.labelIds;

    this._cards.updateCardContent(this.data.cardId, {
      labelIds: currentCardLabels.add(label.id).toJS(),
    });

    this._ctrl.close();
  }

  editLabel(label: Label) {
    this.editedLabel.set(label);
    this.mode.set('editor');
  }

  deleteLabel() {
    const edited = this.editedLabel();
    if (edited) {
      this._labels.deleteLabel(edited.id);
      this.returnToHome();
    }
  }

  createLabel(label: Label) {
    this._labels.createLabel(label.name, label.color);
    this.mode.set('card-labels');
  }

  updateLabel({ id, name, color }: Label) {
    this._labels.updateLabel(id, {
      name,
      color,
    });
    this.returnToHome();
  }

  returnToHome() {
    this.editedLabel.set(null);
    this.mode.set('card-labels');
  }

  onFilterInput(e: Event) {
    const filter = (e.target as HTMLInputElement).value.toLowerCase();
    this._labelFilter.set(filter);
  }
}
