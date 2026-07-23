import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  input,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../../models';
import { createProductUrl } from '../../../shared/utils/create-product-url';
import { ProductImageComponent } from '../../../shared/product-image/product-image.component';

@Component({
  selector: 'ec-search-item',
  imports: [RouterLink, ProductImageComponent],
  templateUrl: './search-item.component.html',
  styleUrl: './search-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchItemComponent {
  anchorRef = viewChild.required<ElementRef>('anchorRef');
  createUrl = createProductUrl;

  product = input.required<Product>();

  @Input()
  set focused(value: boolean) {
    if (value) {
      this.anchorRef().nativeElement.focus();
    } else {
      this.anchorRef().nativeElement.blur();
    }
  }
}
