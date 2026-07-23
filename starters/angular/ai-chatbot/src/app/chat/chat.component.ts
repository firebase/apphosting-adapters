import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  NgZone,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Location } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { InfiniteScrollComponent } from '@ngx-templates/shared/infinite-scroll';
import { List } from 'immutable';

import {
  ChatInputComponent,
  InputEvent,
} from './shared/chat-input/chat-input.component';
import { ChatbotService } from '../data-access/chatbot.service';
import { QueryComponent } from './shared/query/query.component';
import { ChatIntroComponent } from './shared/chat-intro/chat-intro.component';
import { QuerySkeletonComponent } from './shared/query-skeleton/query-skeleton.component';
import { Query } from '../../model';
import { RoutePrefix } from '../route-prefixes';

@Component({
  selector: 'acb-chat',
  imports: [
    ChatInputComponent,
    QueryComponent,
    ChatIntroComponent,
    InfiniteScrollComponent,
    QuerySkeletonComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  private _route = inject(ActivatedRoute);
  private _chatbot = inject(ChatbotService);
  private _location = inject(Location);
  private _router = inject(Router);
  private _zone = inject(NgZone);

  input = viewChild.required<ChatInputComponent>('input');

  loading = signal<boolean>(false);
  chatId = signal<string>('');

  chat = computed(() => this._chatbot.chats().get(this.chatId()));

  private _lastMessage = '';

  queries = computed<List<Query>>(() => {
    const chat = this.chat();
    if (!chat) {
      return this._chatbot.tempChat()?.queries || List();
    }
    return chat.queries.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  });

  private _markQueryCompleted?: () => void;

  constructor() {
    const routerEvents = toSignal(this._router.events);

    effect(() => {
      const event = routerEvents();
      const state = this._chatbot.chatsState();

      if (event instanceof NavigationEnd && state === 'loaded') {
        untracked(() => this._loadData());
      }
    });
  }

  async send(e: InputEvent) {
    this._lastMessage = e.message;
    this._markQueryCompleted = e.complete;

    await this._send(e.message);
    this._markQueryCompleted();
  }

  async sendPredefined(message: string) {
    this._lastMessage = message;
    this._send(message);
    this.input().focus();
  }

  abort() {
    if (this._markQueryCompleted) {
      this._markQueryCompleted();
    }
    this._chatbot.abortLastQuery();
    this._lastMessage = '';
  }

  async loadNextPage(complete: () => void) {
    await this._chatbot.loadChatQueries(this.chatId());
    complete();
  }

  /**
   * Performs a check whether the last query
   * in the list is a newly a created.
   */
  isNewQuery(q: Query): boolean {
    // This is the only viable approach given our data model design
    // (since we use a dummy message before receiving the actual response).
    const isNew =
      q === this.chat()?.queries.last() &&
      !!q.response &&
      q.message === this._lastMessage;

    if (isNew) {
      // This is rather unconventional approach that shouldn't
      // be used, but it's important to clear the last message
      // after we find the new query in order to avoid any
      // potential side effects and/or bugs.
      this._zone.runOutsideAngular(() => {
        setTimeout(() => {
          this._lastMessage = '';
        });
      });
    }

    return isNew;
  }

  private async _send(message: string) {
    const chatId = this.chatId();

    if (chatId) {
      await this._chatbot.sendQuery(chatId, message);
    } else {
      const chat = await this._chatbot.createChat(message);

      if (chat) {
        this.chatId.set(chat.id);
        this._location.go(RoutePrefix.Chat + '/' + chat.id);
      }
    }
  }

  private async _loadData() {
    const chatId = this._route.snapshot.paramMap.get('id');

    if (chatId && this._chatbot.chats().has(chatId)) {
      this.chatId.set(chatId);

      if (!this._chatbot.chatsPages().has(chatId)) {
        this.loading.set(true);
        await this._chatbot.loadChatQueries(chatId);
        this.loading.set(false);
      }
    } else {
      // Replace the URL, if the provided ID is invalid
      this._router.navigate(['/'], { replaceUrl: !!chatId });
      this.chatId.set('');
    }
  }
}
