import { List, Map, Set } from 'immutable';
import { Board, BoardList, Card, Label } from '../../../models';
import { ApiBoardList, ApiBoardDataResponse, ApiCard, ApiLabel } from './types';

export const mapCard = (card: ApiCard, complete: boolean = true) =>
  new Card({
    id: card.id,
    title: card.title,
    labelIds: Set(card.labelIds),
    pos: card.pos,
    listId: card.listId,
    description: card.description,
    complete,
  });

export const mapBoardList = (list: ApiBoardList) =>
  new BoardList({
    id: list.id,
    name: list.name,
    boardId: list.boardId,
  });

export const mapLabel = (label: ApiLabel) =>
  new Label({
    id: label.id,
    name: label.name,
    color: label.color,
  });

export const mapBoardLists = ({
  boardId,
  lists,
}: ApiBoardDataResponse): List<BoardList> =>
  List(lists.map((l, i) => mapBoardList({ ...l, pos: i, boardId })));

export const mapBoardListsCards = ({
  lists,
}: ApiBoardDataResponse): Map<string, Card> => {
  let map = Map<string, Card>();

  for (const list of lists) {
    for (let i = 0; i < list.cards.length; i++) {
      const card = list.cards[i];
      map = map.set(
        card.id,
        mapCard({ ...card, pos: i, listId: list.id }, false),
      );
    }
  }

  return map;
};

export const mapLabels = ({
  labels,
}: ApiBoardDataResponse): Map<string, Label> => {
  let map = Map<string, Label>();

  for (const l of labels) {
    map = map.set(l.id, mapLabel(l));
  }

  return map;
};

export const mapBoard = (board: ApiBoardDataResponse): Board =>
  new Board({
    id: board.boardId,
    name: board.boardName,
    lists: mapBoardLists(board),
    cards: mapBoardListsCards(board),
    labels: mapLabels(board),
  });
