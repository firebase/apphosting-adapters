import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalOutletComponent } from '@ngx-templates/shared/modal';
import { ToastOutletComponent } from '@ngx-templates/shared/toasts';

import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { TextEditorComponent } from './shared/text-editor/text-editor.component';

@Component({
  selector: 'ate-root',
  imports: [
    HeaderComponent,
    FooterComponent,
    TextEditorComponent,
    ModalOutletComponent,
    ToastOutletComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
