import { isAxiosError } from 'axios';

export type SendErrorKind =
  | 'network'
  | 'server'
  | 'rate-limited'
  | 'rejected'
  | 'gone'
  | 'forbidden';

export type SendError = {
  kind: SendErrorKind;
  /** Recoverable errors offer Retry; the others need a different action (edit, delete). */
  recoverable: boolean;
  /** Shown under the failed message. */
  message: string;
};

function serverMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || !('message' in data)) return undefined;
  const { message } = data as { message: unknown };
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  return undefined;
}

/**
 * Maps a failed POST to what the user can do about it.
 * - network: no response at all (offline, timeout, lost response) → stays queued, sent automatically.
 * - server / rate-limited: the server may succeed later → Retry.
 * - rejected / gone / forbidden: retrying the same request cannot work → explain, offer Edit/Delete.
 */
export function classifySendError(error: unknown): SendError {
  if (!isAxiosError(error)) {
    return { kind: 'server', recoverable: true, message: 'Unexpected response from the server.' };
  }
  const status = error.response?.status;
  if (status === undefined) {
    return { kind: 'network', recoverable: true, message: 'Waiting for network' };
  }
  if (status === 429) {
    return {
      kind: 'rate-limited',
      recoverable: true,
      message: 'Too many messages. Try again in a moment.',
    };
  }
  if (status === 408 || status >= 500) {
    return {
      kind: 'server',
      recoverable: true,
      message: 'Server error. Your message was not sent.',
    };
  }
  if (status === 404 || status === 410) {
    return {
      kind: 'gone',
      recoverable: false,
      message: 'This chat is no longer available. Copy or edit your text to send it elsewhere.',
    };
  }
  if (status === 401 || status === 403) {
    return { kind: 'forbidden', recoverable: false, message: "You can't message this user." };
  }
  const reason = serverMessage(error.response?.data);
  return {
    kind: 'rejected',
    recoverable: false,
    message: reason
      ? `Rejected: ${reason}. Edit it and send again.`
      : 'The server rejected this message. Edit it and send again.',
  };
}
