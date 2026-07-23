import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { List } from 'immutable';

import { SearchInputComponent } from '../../../shared/search-input/search-input.component';
import { ProductsApi } from '../../../api/products-api.service';
import { Product } from '../../../../models';
import { IconComponent } from '@ngx-templates/shared/icon';
import { SearchItemComponent } from '../search-item/search-item.component';
import { RoutePrefix } from '../../../route-prefixes';

// Max results shown in the list
const MAX_RESULTS = 4;

// Request search results after the Nth typed character
const SEARCH_AFTER_CHAR = 3;

@Component({
  selector: 'ec-autocomplete-product-search',
  imports: [
    ReactiveFormsModule,
    SearchInputComponent,
    IconComponent,
    SearchItemComponent,
  ],
  templateUrl: './autocomplete-product-search.component.html',
  styleUrl: './autocomplete-product-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteProductSearchComponent {
  productsApi = inject(ProductsApi);
  private _router = inject(Router);
  private _formBuilder = inject(FormBuilder);
  noop = () => {}; // For accessibility purposes

  searchInput = viewChild.required<SearchInputComponent>('searchInput');
  results = viewChild<ElementRef>('results');

  form = this._formBuilder.group({
    search: [
      '',
      [Validators.required, Validators.minLength(SEARCH_AFTER_CHAR)],
    ],
  });

  private _inFocus = signal<boolean>(false);
  private _searchActive = signal<boolean>(false);
  products = signal<List<Product>>(List([]));
  focusedResult = signal<number>(-1);
  showResults = computed(() => this._inFocus() && this._searchActive());

  onSearch() {
    const search = this.form.value.search || '';

    this._router.navigate([RoutePrefix.Products], {
      queryParams: { search },
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event) {
    const t = e.target;
    if (
      t !== this.results()?.nativeElement &&
      t !== this.searchInput().inputRef().nativeElement
    ) {
      this._inFocus.set(false);
      this.focusedResult.set(-1);
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(e: KeyboardEvent) {
    if (!this.showResults() || !this.products().size) {
      return;
    }

    if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const move = e.key === 'ArrowDown' ? 1 : -1;
      const newIdx = this.focusedResult() + move;

      this.focusedResult.set(
        newIdx >= 0 ? newIdx % this.products().size : this.products().size - 1,
      );
    }
  }

  onResultsHover() {
    this.focusedResult.set(-1);
  }

  onInputFocus(focused: boolean) {
    if (focused) {
      this._inFocus.set(true);
    }
  }

  /**
   * Handle auto-completion.
   */
  async onSearchFieldChange() {
    const searchTerm = this.form.value.search || '';
    this.focusedResult.set(-1);

    if (searchTerm.length < SEARCH_AFTER_CHAR) {
      this.products.set(List([]));
      this._searchActive.set(false);
    } else {
      const products = await this.productsApi.getProducts({
        name: searchTerm,
        pageSize: MAX_RESULTS,
      });
      this.products.set(products);
      this._searchActive.set(true);
    }
  }
}
