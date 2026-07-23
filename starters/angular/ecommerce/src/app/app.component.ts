import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TOASTS_COMPONENTS } from '@ngx-templates/shared/toasts';

import { CategoriesService } from './data-access/categories.service';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { LoaderService } from './shared/loader.service';

@Component({
  selector: 'ec-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoaderComponent,
    TOASTS_COMPONENTS,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  categories = inject(CategoriesService);
  loader = inject(LoaderService);

  ngOnInit(): void {
    this.categories.loadCategories();
  }
}
