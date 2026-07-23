import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalOutletComponent } from '@ngx-templates/shared/modal';
import { ToastOutletComponent } from '@ngx-templates/shared/toasts';

import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { ChatbotService } from './data-access/chatbot.service';

@Component({
  selector: 'acb-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    ModalOutletComponent,
    ToastOutletComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private _chatbot = inject(ChatbotService);

  ngOnInit() {
    this._chatbot.loadChats();
  }
}
