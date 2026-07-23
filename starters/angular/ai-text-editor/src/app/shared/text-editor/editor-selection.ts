// The purpose of the class is to provide a container
// for the Web API Selection object. It helps us
// preserving/cloning the required properties of the
// selection when/if the browser (i.e. end user)
// changes the focus.
export class EditorSelection {
  constructor(
    private _range: Range | undefined,
    private _text: string,
  ) {}

  getRange(): Range | undefined {
    return this._range;
  }

  toString(): string {
    return this._text;
  }
}
