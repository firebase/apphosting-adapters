import { Provider } from '@angular/core';
import { environment } from '../../../environments/environment';

const DEFAULT_DELAY = 2000;
const LOREM_IPSUM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

interface IGeminiApi {
  generateChatName(userQuery: string): Promise<string>;
  generateQueryResponse(userQuery: string): Promise<string>;
}

/**
 * Gemini API
 */
export class GeminiApi implements IGeminiApi {
  private _fetch = fetch.bind(globalThis);

  generateChatName(userQuery: string): Promise<string> {
    return this._generate(
      `Generate a single title that shouldn't exceed 4 words based on the following text: "${userQuery}". Output the title directly.`,
    );
  }

  generateQueryResponse(userQuery: string): Promise<string> {
    return this._generate(userQuery, true);
  }

  private async _generate(
    query: string,
    chat: boolean = false,
  ): Promise<string> {
    const path = !chat ? '/gemini' : '/gemini-chat';
    const response = await this._fetch(environment.fetchMockGeminiApiUrl + path, {
      method: 'POST',
      body: JSON.stringify({ prompt: query }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const json = await response.json();

    return json.output;
  }
}

/**
 * Gemini API Mock
 */
class GeminiApiMock implements IGeminiApi {
  constructor(private _delay: number) {}

  generateChatName(_: string): Promise<string> {
    return this._delayResponse('Lorem Ipsum ' + Math.round(Math.random() * 10));
  }

  generateQueryResponse(_: string): Promise<string> {
    return this._delayResponse(LOREM_IPSUM);
  }

  private _delayResponse(response: string) {
    return new Promise<string>((res) =>
      setTimeout(() => res(response), this._delay),
    );
  }
}

/**
 * Enables Gemini API for the Fetch mock.
 */
export const provideGeminiApi = (config: {
  /**
   * Enable or disable mocked data. If disabled, the API will call the api/gemini.js Express server.
   */
  mockedData: boolean;
  /**
   * Set a response delay, if `mockedData: true`. Default: `2000ms`
   */
  delay?: number;
}): Provider => ({
  provide: GeminiApi,
  useValue: !config.mockedData
    ? new GeminiApi()
    : new GeminiApiMock(
        config.delay !== undefined ? config.delay : DEFAULT_DELAY,
      ),
});
