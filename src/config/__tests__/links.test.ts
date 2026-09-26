import { TABS } from '@features/navigation';

import { links } from '../links';

describe('links', () => {
  it('exposes an absolute path for every bottom tab', () => {
    for (const tab of TABS) {
      expect(links[tab.name]).toBe(`/${tab.name}`);
    }
  });

  it('has unique static paths without trailing slashes', () => {
    const values: unknown[] = Object.values(links);
    const paths = values.filter((value): value is string => typeof value === 'string');
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) {
      if (path !== links.root) expect(path.endsWith('/')).toBe(false);
    }
  });

  it('builds dynamic chat and user hrefs', () => {
    expect(links.chat('c_1')).toEqual({ pathname: '/chats/[chatId]', params: { chatId: 'c_1' } });
    expect(links.user('u 1')).toEqual({ pathname: '/users/[userId]', params: { userId: 'u 1' } });
  });
});
