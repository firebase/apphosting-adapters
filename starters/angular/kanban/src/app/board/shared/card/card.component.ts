import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { List } from 'immutable';

import { Card, Label } from '../../../../models';
import { LabelsService } from '../../data-access/labels.service';
import { LabelColoringDirective } from '../label-coloring/label-coloring.directive';

@Component({
  selector: 'kb-card',
  imports: [LabelColoringDirective],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  private _labels = inject(LabelsService);

  card = input.required<Card>();
  open = output<Card>();

  labels = computed<List<Label>>(() =>
    this.card()
      .labelIds.map((id) => this._labels.value().get(id)!)
      .toList()
      .sort(),
  );
}
