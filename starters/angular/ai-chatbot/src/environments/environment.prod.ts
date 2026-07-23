import { Environment } from './env-types';
import { Common } from './common';

export const environment: Environment = {
  ...Common,
  apiUrl: 'https://prod.example.com/api/v1',
  fetchMockGeminiApiUrl: 'http://localhost:4000/api',
};
