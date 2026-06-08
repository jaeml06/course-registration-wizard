import '@testing-library/jest-dom/vitest';

import { server } from '../mocks/server';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  sessionStorage.clear();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

afterAll(() => {
  server.close();
});
