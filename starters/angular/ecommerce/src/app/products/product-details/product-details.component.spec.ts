import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { provideWindow } from '@ngx-templates/shared/services';

import { ProductDetailsComponent } from './product-details.component';
import { ProductsService } from '../../data-access/products.service';
import { CategoriesService } from '../../data-access/categories.service';
import { CartService } from '../../data-access/cart.service';
import { Product } from '../../../models';
import { fetchApiMockProvider } from '../../shared/utils/fetch-mock-provider.test-util';

describe('ProductDetailsComponent', () => {
  let component: ProductDetailsComponent;
  let fixture: ComponentFixture<ProductDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailsComponent],
      providers: [
        provideRouter([]),
        provideWindow(),
        fetchApiMockProvider,
        ProductsService,
        CategoriesService,
        CartService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailsComponent);
    component = fixture.componentInstance;
    component.product = signal(new Product({}));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
