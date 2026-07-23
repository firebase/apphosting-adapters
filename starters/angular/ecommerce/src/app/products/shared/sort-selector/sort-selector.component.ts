import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
  model,
} from '@angular/core';

export type SortType = 'default' | 'price_asc' | 'price_desc';

const SORT_VALUES = new Set<SortType>(['default', 'price_asc', 'price_desc']);

const VAL_NAME: { [key in SortType]: string } = {
  default: 'Default',
  price_asc: 'Price (asc.)',
  price_desc: 'Price (desc.)',
};

export const isOfSortType = (s: string) => SORT_VALUES.has(s as SortType);

@Component({
  selector: 'ec-sort-selector',
  imports: [],
  templateUrl: './sort-selector.component.html',
  styleUrl: './sort-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortSelectorComponent {
  SORT_VALUES = SORT_VALUES;
  VAL_NAME = VAL_NAME;

  value = model<SortType>('default');
  type = input<'horizontal' | 'vertical'>('horizontal');

  @HostBinding('class.vertical')
  get isVertical() {
    return this.type() === 'vertical';
  }

  isSelected(value: SortType) {
    return this.value() === value ? true : null;
  }

  onSortTypeChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.value.set(select.value as SortType);
  }
}
