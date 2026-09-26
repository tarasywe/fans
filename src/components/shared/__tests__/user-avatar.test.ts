import { initials } from '../user-avatar';

describe('initials', () => {
  it('uses the first and last words', () => {
    expect(initials('Ethan Shoots')).toBe('ES');
    expect(initials('Ada Mary Lovelace')).toBe('AL');
  });

  it('skips punctuation and digits', () => {
    expect(initials('Test: send fails (500)')).toBe('TF');
    expect(initials('  émile   zola ')).toBe('ÉZ');
  });

  it('handles single words and empty names', () => {
    expect(initials('madonna')).toBe('M');
    expect(initials('123')).toBe('');
    expect(initials('')).toBe('');
  });
});
