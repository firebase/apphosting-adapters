import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToCartBtnComponent } from './add-to-cart-btn.component';
import { CartService } from '../../../../data-access/cart.service';
import { Product } from '../../../../../models';
import { fetchApiMockProvider } from '../../../../shared/utils/fetch-mock-provider.test-util';

describe('AddToCartBtnComponent', () => {
  let component: AddToCartBtnComponent;
  let fixture: ComponentFixture<AddToCartBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddToCartBtnComponent],
      providers: [CartService, fetchApiMockProvider],
    }).compileComponents();

    fixture = TestBed.createComponent(AddToCartBtnComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', new Product({}));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
