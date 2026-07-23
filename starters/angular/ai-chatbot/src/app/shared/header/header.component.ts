import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLogoComponent } from '@ngx-templates/shared/app-logo';

@Component({
  selector: 'acb-header',
  imports: [AppLogoComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {}
