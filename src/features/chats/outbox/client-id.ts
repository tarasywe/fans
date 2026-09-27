let counter = 0;

/**
 * Idempotency key for one send. Created once when the user taps Send, persisted with the pending
 * message and reused for every retry, including after an app restart. The server uses it to
 * recognise a retry of a send it already accepted.
 */
export function createClientId(now = Date.now()): string {
  counter = (counter + 1) % 1_679_616; // 36^4
  const random = Math.random().toString(36).slice(2, 12).padEnd(10, '0');
  return `c${now.toString(36)}${counter.toString(36).padStart(4, '0')}${random}`;
}
