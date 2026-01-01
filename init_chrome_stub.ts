import {afterAll, beforeAll} from 'vitest';

beforeAll(() => {
  (window.chrome as unknown) = {};
});

afterAll(() => {
  delete (window as {chrome?: unknown}).chrome;
});
