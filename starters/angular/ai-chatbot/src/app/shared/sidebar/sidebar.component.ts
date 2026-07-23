import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostBinding,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { IconComponent } from '@ngx-templates/shared/icon';
import { ThemeSwitchComponent } from '@ngx-templates/shared/theme';
import { LocalStorage } from '@ngx-templates/shared/services';

import { FooterComponent } from './footer/footer.component';
import { ChatLinkComponent } from './chat-link/chat-link.component';
import { ChatbotService } from '../../data-access/chatbot.service';

const SIDEBAR_STATE_KEY = 'acb-sb-expanded';

@Component({
  selector: 'acb-sidebar',
  imports: [
    RouterModule,
    IconComponent,
    FooterComponent,
    ThemeSwitchComponent,
    ChatLinkComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  chatbot = inject(ChatbotService);
  private _storage = inject(LocalStorage);
  private _location = inject(Location);
  private _router = inject(Router);

  expanded = signal<boolean>(false);

  private _routerEvents = toSignal(this._router.events);

  selectedChat = computed(() => {
    const isNavEnd = this._routerEvents() instanceof NavigationEnd;
    if (isNavEnd || this.chatbot.chats().size) {
      // We can't access the route param from the sidebar since it's out of route scope.
      // We rely on the URL composition where the chat ID is last.
      return this._location.path().split('/').pop() || '';
    }
    return '';
  });

  constructor() {
    const expanded = this._storage.get(SIDEBAR_STATE_KEY) === 'true';
    this.expanded.set(expanded);
  }

  toggle() {
    const expanded = !this.expanded();
    this.expanded.set(expanded);
    this._storage.set(SIDEBAR_STATE_KEY, expanded.toString());
  }

  @HostBinding('class.expanded')
  get isExpanded() {
    return this.expanded();
  }
}
