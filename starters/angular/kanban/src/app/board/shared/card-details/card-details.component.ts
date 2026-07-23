import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  MODAL_DATA,
  ModalController,
  ModalService,
} from '@ngx-templates/shared/modal';
import { CtxMenuService } from '@ngx-templates/shared/context-menu';
import { IconComponent } from '@ngx-templates/shared/icon';
import { ButtonComponent } from '@ngx-templates/shared/button';
import { Set } from 'immutable';

import { CardsService } from '../../data-access/cards.service';
import { Card, Label } from '../../../../models';
import {
  ConfirmDeleteData,
  ConfirmDeleteModalComponent,
} from '../confirm-delete-modal/confirm-delete-modal.component';
import { LabelsService } from '../../data-access/labels.service';
import {
  LabelManagerComponent,
  LabelManagerData,
} from './label-manager/label-manager.component';
import { InteractiveTitleComponent } from '../interactive-title/interactive-title.component';
import { LabelColoringDirective } from '../label-coloring/label-coloring.directive';
import { environment } from '../../../../environments/environment';

export interface CardDetailsData {
  cardId: string;
}

@Component({
  selector: 'kb-card-details',
  imports: [
    ReactiveFormsModule,
    InteractiveTitleComponent,
    IconComponent,
    LabelColoringDirective,
    ButtonComponent,
  ],
  templateUrl: './card-details.component.html',
  styleUrl: './card-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDetailsComponent implements OnInit {
  data = inject<CardDetailsData>(MODAL_DATA);
  ctrl = inject(ModalController);

  private _cards = inject(CardsService);
  private _labels = inject(LabelsService);
  private _modal = inject(ModalService);
  private _ctxMenu = inject(CtxMenuService);
  private _formBuilder = inject(FormBuilder);
  private _injector = inject(Injector);

  env = environment;

  descriptionForm = this._formBuilder.group({
    description: [''],
  });

  card = computed<Card>(
    () => this._cards.value().get(this.data.cardId) || new Card({}),
  );

  labels = computed<Set<Label>>(() =>
    this.card().labelIds.map((id) => this._labels.value().get(id)!),
  );

  private _labelsIds = computed<Set<string>>(() =>
    this.labels().map((l) => l.id),
  );

  async ngOnInit() {
    if (!this.card().complete) {
      const card = await this._cards.loadCard(this.data.cardId);
      const exists = card && card.id;

      if (!exists) {
        this.ctrl.close();
      }
    }

    this._setDescription();
  }

  updateTitle(title: string) {
    if (title !== this.card().title) {
      this._cards.updateCardContent(this.data.cardId, { title });
    }
  }

  async updateDescription() {
    const description = this.descriptionForm.value.description || '';
    console.log('updating with', description);
    await this._cards.updateCardContent(this.data.cardId, { description });
    this.resetDescriptionForm();
  }

  resetDescriptionForm() {
    this.descriptionForm.reset();
    this._setDescription();
  }

  openLabelManager(e: MouseEvent) {
    this._ctxMenu.openMenu<LabelManagerData>(
      LabelManagerComponent,
      e,
      {
        cardId: this.card().id,
        cardLabelsIds: this._labelsIds,
      },
      { injector: this._injector },
    );
  }

  deleteCard() {
    this._modal
      .createModal<
        ConfirmDeleteData,
        boolean
      >(ConfirmDeleteModalComponent, { entity: 'card' })
      .closed.then((shouldDelete) => {
        if (shouldDelete) {
          this._cards.deleteCard(this.data.cardId);
          this.ctrl.close();
        }
      });
  }

  removeLabelFromCard(labelId: string) {
    const labelIds = this.card().labelIds.remove(labelId).toJS();
    this._cards.updateCardContent(this.card().id, { labelIds });
  }

  private _setDescription() {
    const description = this.card().description;
    this.descriptionForm.controls.description.setValue(description);
  }
}
