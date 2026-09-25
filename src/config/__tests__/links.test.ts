import { TABS } from '@features/navigation';

import { links } from '../links';

describe('links', () => {
  it('exposes an absolute path for every bottom tab', () => {
    for (const tab of TABS) {
      expect(links[tab.name]).toBe(`/${tab.name}`);
    }
  });

  it('has unique paths', () => {
    const paths = Object.values(links);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('never contains trailing slashes except for root', () => {
    for (const path of Object.values(links)) {
      if (path !== links.root) expect(path.endsWith('/')).toBe(false);
    }
  });
});
