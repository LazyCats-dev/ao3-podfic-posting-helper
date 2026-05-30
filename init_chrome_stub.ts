import {afterAll, beforeAll} from 'vitest';

beforeAll(() => {
  (window.chrome as unknown) = {};
});

afterAll(() => {
  try {
    delete (window as {chrome?: unknown}).chrome;
  } catch (e) {}
});
