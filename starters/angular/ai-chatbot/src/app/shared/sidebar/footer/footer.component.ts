import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconComponent } from '@ngx-templates/shared/icon';

@Component({
  selector: 'acb-footer',
  imports: [IconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
