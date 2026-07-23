export type ApiQuery = {
  id: string;
  message: string;
  createdAt: string;
  response: string;
};

export type ApiChat = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  totalQueries: number;
  queries?: ApiQuery[];
};

export type ApiChatPage = {
  id: string;
  queries: ApiQuery[];
};
