import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  Input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '@ngx-templates/shared/button';

import { ColorPickerComponent } from './color-picker/color-picker.component';
import { Label } from '../../../../../../models';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'kb-label-form',
  imports: [ReactiveFormsModule, ColorPickerComponent, ButtonComponent],
  templateUrl: './label-form.component.html',
  styleUrl: './label-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelFormComponent {
  private _formBuilder = inject(FormBuilder);
  form = this._formBuilder.group({
    name: ['', [Validators.required, Validators.pattern(/\S+/)]],
    color: ['', Validators.required],
  });

  env = environment;

  submitButtonName = input<string>('Create');
  formSubmit = output<Label>();

  private _id?: string;

  @Input()
  set label(v: Label) {
    this._id = v.id;
    this.form.controls.name.setValue(v.name);
    this.form.controls.color.setValue(v.color);
  }

  onSubmit() {
    const { name, color } = this.form.value;

    this.formSubmit.emit(
      new Label({
        id: this._id,
        name: name!.trim(),
        color: color!,
      }),
    );
  }
}
