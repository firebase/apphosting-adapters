import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideWindow } from '@ngx-templates/shared/services';
import { provideRouter } from '@angular/router';

import { ProductsComponent } from './products.component';
import { CategoriesService } from '../data-access/categories.service';
import { fetchApiMockProvider } from '../shared/utils/fetch-mock-provider.test-util';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [
        provideRouter([]),
        provideWindow(),
        fetchApiMockProvider,
        CategoriesService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
