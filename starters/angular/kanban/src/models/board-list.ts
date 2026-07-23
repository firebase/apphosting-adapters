import { Record } from 'immutable';

interface BoardListConfig {
  id: string;
  name: string;
  boardId: string;
}

const boardListRecord = Record<BoardListConfig>({
  id: '',
  name: '',
  boardId: '',
});

export class BoardList extends boardListRecord {
  constructor(config: Partial<BoardListConfig>) {
    super(config);
  }
}
