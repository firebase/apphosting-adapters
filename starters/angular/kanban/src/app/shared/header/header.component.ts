import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppLogoComponent } from '@ngx-templates/shared/app-logo';
import { THEME_COMPONENTS } from '@ngx-templates/shared/theme';
import { IconComponent } from '@ngx-templates/shared/icon';
import { ModalService } from '@ngx-templates/shared/modal';
import { AboutModalComponent } from './about-modal/about-modal.component';

@Component({
  selector: 'kb-header',
  imports: [AppLogoComponent, IconComponent, THEME_COMPONENTS],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private _modal = inject(ModalService);

  openAboutModal() {
    this._modal.createModal(AboutModalComponent);
  }
}
