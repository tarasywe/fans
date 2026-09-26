import { matchRoute } from '../match-route';
import type { MockRoute } from '../mock-types';

const handler = () => null;
const routes: MockRoute[] = [
  { method: 'get', path: '/chats', handler },
  { method: 'post', path: '/chats', handler },
  { method: 'get', path: '/chats/:chatId', handler },
  { method: 'get', path: '/chats/new', handler },
  { method: 'get', path: '/chats/:chatId/messages', handler },
];

describe('matchRoute', () => {
  it('matches static paths by method', () => {
    expect(matchRoute(routes, 'get', '/chats')?.route).toBe(routes[0]);
    expect(matchRoute(routes, 'post', '/chats')?.route).toBe(routes[1]);
  });

  it('extracts and decodes params', () => {
    expect(matchRoute(routes, 'get', '/chats/c%201/messages')?.params).toEqual({ chatId: 'c 1' });
  });

  it('prefers static segments over params', () => {
    expect(matchRoute(routes, 'get', '/chats/new')?.route).toBe(routes[3]);
  });

  it('ignores trailing slashes', () => {
    expect(matchRoute(routes, 'get', '/chats/')?.route).toBe(routes[0]);
  });

  it('returns null for unknown paths, wrong methods or extra segments', () => {
    expect(matchRoute(routes, 'get', '/users')).toBeNull();
    expect(matchRoute(routes, 'delete', '/chats')).toBeNull();
    expect(matchRoute(routes, 'get', '/chats/1/messages/2')).toBeNull();
  });
});
