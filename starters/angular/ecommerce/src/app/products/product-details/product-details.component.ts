import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { ImageGalleryComponent } from './shared/image-gallery/image-gallery.component';
import { ProductsService } from '../../data-access/products.service';
import { Product } from '../../../models';
import { CategoriesService } from '../../data-access/categories.service';
import { PriceTagComponent } from '../../shared/price-tag/price-tag.component';
import { AddToCartBtnComponent } from './shared/add-to-cart-btn/add-to-cart-btn.component';
import { LoaderService } from '../../shared/loader.service';
import { ScrollPosition } from '../../shared/scroll-position.service';

@Component({
  selector: 'ec-product-details',
  imports: [
    ImageGalleryComponent,
    PriceTagComponent,
    AddToCartBtnComponent,
    RouterModule,
  ],
  providers: [ScrollPosition],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _products = inject(ProductsService);
  private _categories = inject(CategoriesService);
  private _loader = inject(LoaderService);
  private _scrollPos = inject(ScrollPosition);

  ngOnInit() {
    this._loader.hideLoader();
    this._scrollPos.reset();
  }

  // We assume that the product will exist in the state
  // given that we have a route guard that ensures that.
  id = signal<string>(this._route.snapshot.paramMap.get('id')!);
  product = computed<Product>(() => this._products.value().get(this.id())!);
  categories = computed(() =>
    this.product().categoryIds.map((id) => this._categories.value().get(id)),
  );
}
