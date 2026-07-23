import { List, Map } from 'immutable';
import { Chat, Query } from '../../../model';
import { ApiChat, ApiQuery } from './api-types';

export const mapQuery = (query: ApiQuery) =>
  new Query({
    id: query.id,
    message: query.message,
    response: query.response,
    createdAt: new Date(query.createdAt),
  });

export const mapQueries = (queries: ApiQuery[]) => List(queries.map(mapQuery));

export const mapChat = (chat: ApiChat) =>
  new Chat({
    id: chat.id,
    name: chat.name,
    createdAt: new Date(chat.createdAt),
    updatedAt: new Date(chat.updatedAt),
    totalQueries: chat.totalQueries,
    queries: mapQueries(chat.queries || []),
  });

export const mapChats = (chats: ApiChat[]) =>
  Map<string, Chat>(chats.map((c) => [c.id, mapChat(c)]));
