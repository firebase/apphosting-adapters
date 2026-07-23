import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ModalContentComponent,
  ModalController,
} from '@ngx-templates/shared/modal';
import { ButtonComponent } from '@ngx-templates/shared/button';
import { urlValidator } from './url.validator';

@Component({
  selector: 'ate-hyperlink-modal',
  imports: [ModalContentComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './hyperlink-modal.component.html',
  styleUrl: './hyperlink-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HyperlinkModalComponent implements AfterViewInit {
  ctrl: ModalController<string> = inject(ModalController);

  private _formBuilder = inject(FormBuilder);

  input = viewChild.required<ElementRef>('input');
  form = this._formBuilder.group({
    url: ['', [Validators.required, urlValidator]],
  });

  ngAfterViewInit() {
    this.input().nativeElement.focus();
  }

  addLink() {
    let url = this.form.get('url')?.value || '';
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }

    this.ctrl.close(url);
  }
}
