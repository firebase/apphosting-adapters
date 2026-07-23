import { List, Record } from 'immutable';
import { Query } from './query';

interface ChatConfig {
  id: string;
  name: string;
  queries: List<Query>;
  totalQueries: number;
  createdAt: Date;
  updatedAt: Date;
}

const chatRecord = Record<ChatConfig>({
  id: '',
  name: '',
  queries: List(),
  totalQueries: 0,
  createdAt: new Date(0),
  updatedAt: new Date(0),
});

export class Chat extends chatRecord {
  constructor(config: Partial<ChatConfig>) {
    super(config);
  }
}
