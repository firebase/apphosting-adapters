import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalOutletComponent } from '@ngx-templates/shared/modal';

import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ig-root',
  imports: [
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ModalOutletComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
