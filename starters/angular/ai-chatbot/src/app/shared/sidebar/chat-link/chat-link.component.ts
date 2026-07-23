import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  inject,
  input,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { IconComponent } from '@ngx-templates/shared/icon';
import { ModalService } from '@ngx-templates/shared/modal';
import { ToastsService } from '@ngx-templates/shared/toasts';

import { Chat } from '../../../../model';
import {
  ConfirmDeleteData,
  ConfirmDeleteModalComponent,
} from './confirm-delete-modal/confirm-delete-modal.component';
import { ChatbotService } from '../../../data-access/chatbot.service';
import { RoutePrefix } from '../../../route-prefixes';

@Component({
  selector: 'acb-chat-link',
  imports: [RouterModule, IconComponent],
  templateUrl: './chat-link.component.html',
  styleUrl: './chat-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatLinkComponent {
  private _chatbot = inject(ChatbotService);
  private _modal = inject(ModalService);
  private _toast = inject(ToastsService);
  private _router = inject(Router);

  chat = input.required<Chat>();
  isSelected = input<boolean>(false);

  RoutePrefix = RoutePrefix;

  async deleteChat() {
    const shouldDelete = await this._modal.createModal<
      ConfirmDeleteData,
      boolean
    >(ConfirmDeleteModalComponent, {
      chat: this.chat(),
    }).closed;

    if (shouldDelete) {
      this._chatbot.deleteChat(this.chat().id).then(() => {
        this._toast.create('Chat successfully deleted.');

        if (this.isSelected()) {
          this._router.navigate(['/'], { replaceUrl: true });
        }
      });
    }
  }

  @HostBinding('class.selected')
  private get _isSelected() {
    return this.isSelected();
  }
}
