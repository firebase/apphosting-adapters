import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '@ngx-templates/shared/icon';
import { ButtonComponent } from '@ngx-templates/shared/button';

@Component({
  selector: 'kb-add-list',
  imports: [ReactiveFormsModule, IconComponent, ButtonComponent],
  templateUrl: './add-list.component.html',
  styleUrl: './add-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddListComponent {
  private _formBuilder = inject(FormBuilder);

  form = this._formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S+/)]],
  });

  listCreator = signal<boolean>(false);
  nameInput = viewChild<ElementRef>('nameInput');

  listCreate = output<string>();

  constructor() {
    effect(() => {
      const nameInput = this.nameInput();
      if (this.listCreator() && nameInput) {
        nameInput.nativeElement.focus();
      }
    });
  }

  addList() {
    this.listCreator.set(false);

    const name = this.form.value.name as string;
    this.listCreate.emit(name.trim());

    this.form.reset();
  }

  @HostListener('document:click')
  onDocumntClick() {
    this.listCreator.set(false);
  }
}
