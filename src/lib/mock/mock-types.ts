export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type MockRequest = {
  method: HttpMethod;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
};

export type MockRoute = {
  method: HttpMethod;
  /** Express-style pattern, e.g. `/chats/:chatId/messages`. */
  path: string;
  handler: (request: MockRequest) => unknown;
};

export class MockHttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'MockHttpError';
    this.status = status;
  }
}
