import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { IconComponent } from '@ngx-templates/shared/icon';
import { ButtonComponent } from '@ngx-templates/shared/button';
import { SearchInputComponent } from '../../../shared/search-input/search-input.component';

@Component({
  selector: 'ec-product-search',
  imports: [
    ReactiveFormsModule,
    IconComponent,
    ButtonComponent,
    SearchInputComponent,
  ],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductSearchComponent {
  private _formBuilder = inject(FormBuilder);
  search = output<string>();

  searchForm = this._formBuilder.group({
    searchString: [''],
  });

  onProductSearch(e: Event) {
    e.preventDefault();
    const searchString = this.searchForm.value.searchString || '';

    this.search.emit(searchString);
  }
}
