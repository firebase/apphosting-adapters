import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@ngx-templates/shared/icon';
import { AppLogoComponent } from '@ngx-templates/shared/app-logo';
import { CartService } from '../../data-access/cart.service';

@Component({
  selector: 'ec-header',
  imports: [RouterLink, IconComponent, AppLogoComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  cart = inject(CartService);
}
