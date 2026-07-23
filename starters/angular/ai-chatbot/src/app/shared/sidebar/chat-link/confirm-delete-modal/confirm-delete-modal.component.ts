import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MODAL_DATA,
  ModalContentComponent,
  ModalController,
} from '@ngx-templates/shared/modal';
import { ButtonComponent } from '@ngx-templates/shared/button';
import { Chat } from '../../../../../model';

export type ConfirmDeleteData = {
  chat: Chat;
};

@Component({
  selector: 'acb-confirm-delete-modal',
  imports: [ModalContentComponent, ButtonComponent],
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModalComponent {
  data = inject<ConfirmDeleteData>(MODAL_DATA);
  ctrl = inject(ModalController);
}
