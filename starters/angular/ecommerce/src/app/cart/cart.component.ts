import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { IconComponent } from '@ngx-templates/shared/icon';
import { ButtonComponent } from '@ngx-templates/shared/button';

import { CartService } from '../data-access/cart.service';
import { CartItemComponent } from './shared/cart-item/cart-item.component';
import { Product } from '../../models';
import { environment } from '../../environments/environment';
import { CurrencyPipe } from '../shared/pipes/currency.pipe';

@Component({
  selector: 'ec-cart',
  imports: [CartItemComponent, CurrencyPipe, IconComponent, ButtonComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  cart = inject(CartService);

  subtotal = this.cart.total;
  shipping = environment.shippingCost;
  taxes = computed(() => this.subtotal() * environment.taxPercentage);
  total = computed(() => this.subtotal() + this.taxes() + this.shipping);

  ngOnInit() {
    this.cart.loadCartProducts();
  }

  onItemRemove(product: Product) {
    this.cart.removeFromCart(product);
  }

  onItemQuanityUpdate(product: Product, quantity: number) {
    this.cart.updateQuantity(product, quantity, false);
  }
}
