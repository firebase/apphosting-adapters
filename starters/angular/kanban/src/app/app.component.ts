import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalOutletComponent } from '@ngx-templates/shared/modal';
import { CtxMenuOutletComponent } from '@ngx-templates/shared/context-menu';

import { HeaderComponent } from './shared/header/header.component';

@Component({
  selector: 'kb-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    ModalOutletComponent,
    CtxMenuOutletComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
