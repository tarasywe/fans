import { AxiosError, AxiosHeaders } from 'axios';

import { classifySendError } from '../outbox/send-error';

function httpError(status: number, data: unknown = {}) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('failed', String(status), config, undefined, {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(),
    config,
  });
}

describe('classifySendError', () => {
  it('treats "no response" as a network problem that is retried automatically', () => {
    expect(
      classifySendError(new AxiosError('Network Error', AxiosError.ERR_NETWORK)),
    ).toMatchObject({
      kind: 'network',
      recoverable: true,
    });
    expect(classifySendError(new AxiosError('timeout', AxiosError.ECONNABORTED))).toMatchObject({
      kind: 'network',
    });
  });

  it('offers Retry for server errors and rate limiting', () => {
    expect(classifySendError(httpError(500))).toMatchObject({ kind: 'server', recoverable: true });
    expect(classifySendError(httpError(503))).toMatchObject({ kind: 'server', recoverable: true });
    expect(classifySendError(httpError(429))).toMatchObject({
      kind: 'rate-limited',
      recoverable: true,
    });
  });

  it('explains errors that retrying cannot fix', () => {
    expect(classifySendError(httpError(404))).toMatchObject({ kind: 'gone', recoverable: false });
    expect(classifySendError(httpError(403))).toMatchObject({
      kind: 'forbidden',
      recoverable: false,
    });
    const rejected = classifySendError(
      httpError(400, { message: ['Message cannot exceed 400 characters'] }),
    );
    expect(rejected).toMatchObject({ kind: 'rejected', recoverable: false });
    expect(rejected.message).toContain('Message cannot exceed 400 characters');
  });

  it('treats unexpected (non-HTTP) failures as recoverable', () => {
    expect(classifySendError(new Error('bad json'))).toMatchObject({
      kind: 'server',
      recoverable: true,
    });
  });
});
