import { BoardList, Card, Label } from '../../../models';
import { ApiRequestBoardList, ApiRequestCard, ApiRequestLabel } from './types';

export const mapApiRequestBoardList = (
  list: BoardList,
): ApiRequestBoardList => ({
  name: list.name,
});

export const mapApiRequestCard = (card: Card): ApiRequestCard => ({
  title: card.title,
  listId: card.listId,
  description: card.description,
});

export const mapApiRequestLabel = (label: Label): ApiRequestLabel => ({
  name: label.name,
  color: label.color,
});
