import axios, { AxiosError } from 'axios';

import { installMockApi } from '../install-mock-api';
import { MockHttpError, type MockRoute } from '../mock-types';

const routes: MockRoute[] = [
  { method: 'get', path: '/echo/:id', handler: ({ params, query }) => ({ params, query }) },
  { method: 'post', path: '/echo', handler: ({ body }) => body },
  {
    method: 'get',
    path: '/forbidden',
    handler: () => {
      throw new MockHttpError(403, 'Nope');
    },
  },
  {
    method: 'get',
    path: '/crash',
    handler: () => {
      throw new Error('boom');
    },
  },
];

function client() {
  const instance = axios.create({ baseURL: 'https://api.test' });
  installMockApi(instance, routes, { minMs: 0, maxMs: 0 });
  return instance;
}

async function statusOf(promise: Promise<unknown>): Promise<number | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof AxiosError ? error.response?.status : -1;
  }
}

describe('mock adapter', () => {
  it('passes params and query (from url and config) to handlers', async () => {
    const { data, status } = await client().get('/echo/42?a=1', {
      params: { b: 2, skip: undefined },
    });
    expect(status).toBe(200);
    expect(data).toEqual({ params: { id: '42' }, query: { a: '1', b: '2' } });
  });

  it('parses JSON bodies and answers POST with 201', async () => {
    const { data, status } = await client().post('/echo', { hello: 'world' });
    expect(status).toBe(201);
    expect(data).toEqual({ hello: 'world' });
  });

  it('rejects unknown routes with 404', async () => {
    expect(await statusOf(client().get('/missing'))).toBe(404);
  });

  it('maps MockHttpError to its status and other errors to 500', async () => {
    expect(await statusOf(client().get('/forbidden'))).toBe(403);
    expect(await statusOf(client().get('/crash'))).toBe(500);
  });
});
