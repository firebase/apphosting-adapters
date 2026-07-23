import { Record } from 'immutable';

interface CategoryConfig {
  id: string;
  name: string;
  order: number;
}

const categoryRecord = Record<CategoryConfig>({
  id: '',
  name: '',
  order: 0,
});

export class Category extends categoryRecord {
  constructor(config: Partial<CategoryConfig>) {
    super(config);
  }
}
