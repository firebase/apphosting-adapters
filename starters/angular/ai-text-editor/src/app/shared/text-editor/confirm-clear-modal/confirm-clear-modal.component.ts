import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ModalContentComponent,
  ModalController,
} from '@ngx-templates/shared/modal';
import { ButtonComponent } from '@ngx-templates/shared/button';

@Component({
  selector: 'ate-confirm-clear-modal',
  imports: [ModalContentComponent, ButtonComponent],
  templateUrl: './confirm-clear-modal.component.html',
  styleUrl: './confirm-clear-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmClearModalComponent {
  ctrl: ModalController<boolean> = inject(ModalController);
}
