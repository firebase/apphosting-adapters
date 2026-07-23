import { Record } from 'immutable';

interface QueryConfig {
  id: string;
  message: string;
  response: string;
  createdAt: Date;
}

const queryRecord = Record<QueryConfig>({
  id: '',
  message: '',
  response: '',
  createdAt: new Date(0),
});

export class Query extends queryRecord {
  constructor(config: Partial<QueryConfig>) {
    super(config);
  }
}
