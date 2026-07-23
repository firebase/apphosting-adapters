import { AbstractControl, ValidationErrors } from '@angular/forms';

// Source: https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url#answer-3809435
// Note(Georgi): Slightly modified
const VALID_URL_REGEX =
  /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$/;

export const urlValidator = (
  control: AbstractControl,
): ValidationErrors | null => {
  const validUrl = VALID_URL_REGEX.test(control.value);
  return validUrl ? null : { invalidUrl: { value: control.value } };
};
