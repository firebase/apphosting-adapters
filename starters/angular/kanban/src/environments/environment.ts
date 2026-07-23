// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from './env-types';
import { Common } from './common';

export const environment: Environment = {
  ...Common,
  apiUrl: 'http://localhost:3000/api/v1',
};
