import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { List } from 'immutable';

import { ProductItemComponent } from '../../../shared/product-item/product-item.component';
import { Category, Product } from '../../../../models';
import { ProductsApi } from '../../../api/products-api.service';

const REEL_SIZE = 5;

@Component({
  selector: 'ec-category-reel',
  imports: [RouterLink, ProductItemComponent],
  templateUrl: './category-reel.component.html',
  styleUrl: './category-reel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryReelComponent implements OnInit {
  private _productsApi = inject(ProductsApi);

  category = input.required<Category>();
  isLcp = input<boolean>(false);

  products = signal<List<Product>>(List([]));

  async ngOnInit() {
    const products = await this._productsApi.getProducts(
      {
        categoryId: this.category().id,
        pageSize: REEL_SIZE,
      },
      false,
    );
    this.products.set(products);
  }
}
