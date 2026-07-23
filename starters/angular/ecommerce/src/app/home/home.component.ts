import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';

import { AutocompleteProductSearchComponent } from './shared/autocomplete-product-search/autocomplete-product-search.component';
import { CategoryReelComponent } from './shared/category-reel/category-reel.component';
import { CategoriesService } from '../data-access/categories.service';
import { ScrollPosition } from '../shared/scroll-position.service';
import { isProductDetailsRoute } from '../shared/utils/routing';
import { maintainScrollPosEffect } from '../shared/utils/maintain-scroll-pos-effect';

// Limit the number of categories
// that are shown on the home page.
const CATEGORY_REELS_COUNT = 3;

@Component({
  selector: 'ec-home',
  imports: [AutocompleteProductSearchComponent, CategoryReelComponent],
  providers: [ScrollPosition],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private _categories = inject(CategoriesService);

  categories = computed(() =>
    this._categories.categoriesList().take(CATEGORY_REELS_COUNT),
  );

  constructor() {
    maintainScrollPosEffect(isProductDetailsRoute);
  }
}
