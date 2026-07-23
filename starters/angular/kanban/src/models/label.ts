import { Record } from 'immutable';

interface LabelConfig {
  id: string;
  name: string;
  color: string;
}

const labelRecord = Record<LabelConfig>({
  id: '',
  name: '',
  color: '',
});

export class Label extends labelRecord {
  constructor(config: Partial<LabelConfig>) {
    super(config);
  }
}
