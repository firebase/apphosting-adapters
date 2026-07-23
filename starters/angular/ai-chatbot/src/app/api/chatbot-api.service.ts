import { inject, Injectable } from '@angular/core';
import { FETCH_API, fetchAbort } from '@ngx-templates/shared/fetch';
import { buildQueryParamsString } from '@ngx-templates/shared/utils';
import { List, Map } from 'immutable';

import { environment } from '../../environments/environment';

import { Chat, Query } from '../../model';
import { mapChat, mapChats, mapQueries, mapQuery } from './utils/mappers';

@Injectable({ providedIn: 'root' })
export class ChatbotApi {
  private _abortIfInProgress = fetchAbort();
  private _fetch = inject(FETCH_API);

  /**
   * Fetches all available chats without their queries.
   */
  async getChats(): Promise<Map<string, Chat>> {
    const response = await this._fetch(`${environment.apiUrl}/chats`);
    const json = response?.ok ? await response.json() : [];

    return mapChats(json);
  }

  /**
   * Creates a new chat by a provided initial/start message.
   *
   * @param message Initial message
   * @returns A chat
   */
  async createChat(message: string): Promise<Chat | undefined> {
    const signal = this._abortIfInProgress(this.sendQuery.name);

    const response = await this._fetch(`${environment.apiUrl}/chats`, {
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    }).catch(() => {}); // Handle aborted requests

    return response?.ok ? mapChat(await response.json()) : undefined;
  }

  /**
   * Fetches all queries of the provided chat that match
   * the filter criteria.
   *
   * @param chatId Chat ID
   * @param params The page size and page number
   * @returns Queries
   */
  async getChatQueries(
    chatId: string,
    params?: Partial<{
      pageSize: number;
      page: number;
    }>,
  ): Promise<List<Query>> {
    const queryParams = buildQueryParamsString({
      pageSize: environment.chatPageSize,
      ...params,
    });
    const response = await this._fetch(
      `${environment.apiUrl}/chats/${chatId}/queries${queryParams}`,
    );
    const json = response?.ok ? await response.json() : [];

    return mapQueries(json);
  }

  /**
   * Sends a query to an existing chat.
   *
   * @param chatId Chat ID
   * @param message Message
   * @returns
   */
  async sendQuery(chatId: string, message: string): Promise<Query | undefined> {
    const signal = this._abortIfInProgress(this.sendQuery.name);

    const response = await this._fetch(
      `${environment.apiUrl}/chats/${chatId}/queries`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      },
    ).catch(() => {}); // Handle aborted requests

    return response?.ok ? mapQuery(await response.json()) : undefined;
  }

  /**
   * Deletes a chat.
   *
   * @param chatId Chat ID
   */
  async deleteChat(chatId: string): Promise<void> {
    await this._fetch(`${environment.apiUrl}/chats/${chatId}`, {
      method: 'DELETE',
    });
    return;
  }

  /**
   * Aborts the last query, if in progress.
   */
  abortLastQuery() {
    this._abortIfInProgress('sendQuery');
    this._abortIfInProgress('createChat');
  }
}
