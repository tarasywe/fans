import {
  type AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { matchRoute } from './match-route';
import { useMockFaults } from './mock-faults';
import { type HttpMethod, MockHttpError, type MockRoute } from './mock-types';

export type MockDelay = { minMs: number; maxMs: number };

/** Visible latency so loading states can be seen while developing. Zero under Jest. */
export const DEFAULT_MOCK_DELAY: MockDelay =
  process.env.NODE_ENV === 'test' ? { minMs: 0, maxMs: 0 } : { minMs: 500, maxMs: 1100 };

function wait(delay: MockDelay): Promise<void> {
  const ms = delay.minMs + Math.random() * (delay.maxMs - delay.minMs);
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

function toQuery(params: unknown): Record<string, string> {
  if (!params || typeof params !== 'object') return {};
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query[key] = String(value);
  }
  return query;
}

function toHeaders(headers: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  const source =
    headers && typeof headers === 'object' && 'toJSON' in headers
      ? (headers as { toJSON: () => Record<string, unknown> }).toJSON()
      : (headers as Record<string, unknown> | undefined);
  for (const [key, value] of Object.entries(source ?? {})) {
    if (value !== undefined && value !== null) result[key.toLowerCase()] = String(value);
  }
  return result;
}

function response(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown,
): AxiosResponse {
  return { data, status, statusText: String(status), headers: new AxiosHeaders(), config };
}

/**
 * Axios adapter that intercepts every request and answers from in-memory mock routes.
 * Unknown routes reject with 404, handler errors with their MockHttpError status (or 500).
 */
export function createMockAdapter(
  routes: readonly MockRoute[],
  delay: MockDelay = DEFAULT_MOCK_DELAY,
): AxiosAdapter {
  return async (config) => {
    await wait(delay);

    const method = (config.method ?? 'get').toLowerCase() as HttpMethod;
    const url = new URL(config.url ?? '/', 'http://mock.local');
    const match = matchRoute(routes, method, url.pathname);

    const fail = (status: number, message: string): never => {
      throw new AxiosError(
        message,
        String(status),
        config,
        undefined,
        response(config, status, { message }),
      );
    };

    const faults = useMockFaults.getState();
    const lostNetwork = (): never => {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    };

    // Injected faults (see mock-faults.ts). Offline: the request never reaches the server.
    if (faults.offline) return lostNetwork();
    if (method === 'post' && faults.consume('failWith500')) {
      return fail(500, 'Injected server error (Dev Tools)');
    }

    if (!match) return fail(404, `No mock route for ${method.toUpperCase()} ${url.pathname}`);

    try {
      const data = await match.route.handler({
        method,
        path: url.pathname,
        params: match.params,
        query: { ...Object.fromEntries(url.searchParams), ...toQuery(config.params) },
        body: parseBody(config.data),
        headers: toHeaders(config.headers),
      });
      // Lost response: the server already applied the request, but the client never hears back.
      if (method === 'post' && useMockFaults.getState().consume('loseResponses')) lostNetwork();
      return response(config, method === 'post' ? 201 : 200, data);
    } catch (error) {
      if (error instanceof AxiosError) throw error;
      if (error instanceof MockHttpError) return fail(error.status, error.message);
      return fail(500, error instanceof Error ? error.message : 'Mock handler failed');
    }
  };
}
