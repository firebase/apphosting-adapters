import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
} from '@angular/core';
import { Product } from '../../../models';
import { CurrencyPipe } from '../pipes/currency.pipe';
import { PercentPipe } from '@angular/common';

type PriceTagSize = 'small' | 'large';
type PriceTagType = 'full' | 'prices-only' | 'current-price';

@Component({
  selector: 'ec-price-tag',
  imports: [CurrencyPipe, PercentPipe],
  templateUrl: './price-tag.component.html',
  styleUrl: './price-tag.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceTagComponent {
  product = input.required<Product>();
  size = input<PriceTagSize>('small');

  /**
   * Defines the displayed data:
   *
   * `full` – Discount price, regular price and discount percentage (if discount exists);
   * `prices-only` – Discount and regular price (if discount exists);
   * `current-price` – Discount or regular price (if discount exists);
   */
  type = input<PriceTagType>('full');

  @HostBinding('class.large-tag')
  get isLargeTag() {
    return this.size() === 'large';
  }
}
