import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { PREDEFINED_MESSAGES } from './predefined-msgs';

@Component({
  selector: 'acb-chat-intro',
  imports: [],
  templateUrl: './chat-intro.component.html',
  styleUrl: './chat-intro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatIntroComponent {
  message = output<string>();

  predefinedMessages = PREDEFINED_MESSAGES;
}
