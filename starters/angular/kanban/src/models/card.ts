import { Record, Set } from 'immutable';

interface CardConfig {
  id: string;
  title: string;
  description: string;
  pos: number;
  listId: string;
  labelIds: Set<string>;
  complete: boolean;
}

const cardRecord = Record<CardConfig>({
  id: '',
  title: '',
  description: '',
  pos: -1,
  listId: '',
  labelIds: Set([]),
  complete: false,
});

export class Card extends cardRecord {
  constructor(config: Partial<CardConfig>) {
    super(config);
  }
}
