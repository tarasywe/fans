import { INITIAL_TAB, TABS } from '../tabs';

describe('TABS', () => {
  it('renders exactly five tabs', () => {
    expect(TABS).toHaveLength(5);
  });

  it('places chats in the middle', () => {
    expect(TABS[Math.floor(TABS.length / 2)]?.name).toBe('chats');
  });

  it('opens chats by default', () => {
    expect(INITIAL_TAB).toBe('chats');
    expect(TABS.some((tab) => tab.name === INITIAL_TAB)).toBe(true);
  });

  it('has unique names and non-empty titles', () => {
    expect(new Set(TABS.map((tab) => tab.name)).size).toBe(TABS.length);
    for (const tab of TABS) expect(tab.title.trim()).not.toHaveLength(0);
  });
});
