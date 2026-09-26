import { createRandom } from '../seeded-random';

describe('createRandom', () => {
  it('is deterministic for the same seed', () => {
    const a = createRandom(1);
    const b = createRandom(1);
    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next));
  });

  it('keeps int() within bounds', () => {
    const random = createRandom(3);
    for (let i = 0; i < 200; i += 1) {
      const value = random.int(2, 4);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(4);
    }
  });

  it('throws when picking from an empty array', () => {
    expect(() => createRandom(1).pick([])).toThrow();
  });
});
