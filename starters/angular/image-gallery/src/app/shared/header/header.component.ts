import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLogoComponent } from '@ngx-templates/shared/app-logo';
import { THEME_COMPONENTS } from '@ngx-templates/shared/theme';

@Component({
  selector: 'ig-header',
  imports: [AppLogoComponent, THEME_COMPONENTS],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
