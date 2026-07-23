export type Response<T> = Promise<T | undefined>;

// Response types

export type ApiCard = {
  id: string;
  title: string;
  labelIds: string[];
  pos?: number;
  listId?: string;
  description?: string;
};

export type ApiBoardList = {
  id: string;
  name: string;
  cards: ApiCard[];
  pos?: number;
  boardId?: string;
};

export type ApiLabel = {
  id: string;
  name: string;
  color: string;
};

export type ApiBoardDataResponse = {
  boardId: string;
  boardName: string;
  lists: ApiBoardList[];
  labels: ApiLabel[];
};

// Request types

export type ApiRequestBoardList = {
  pos?: number;
  name?: string;
};

export type ApiRequestCard = {
  title?: string;
  labelIds?: string[];
  pos?: number;
  listId?: string;
  description?: string;
};

export type ApiRequestLabel = {
  name?: string;
  color?: string;
};
