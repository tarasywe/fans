import type { Random } from './seeded-random';

const SENTENCES = [
  'Hey! How are you doing today?',
  'Thanks so much for the support, it really means a lot.',
  'Just dropped a new set, let me know what you think!',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Ut ultrices aliquam turpis in rhoncus.',
  'Morbi et risus nunc. Cras nulla quam, iaculis ut nisl sed, commodo efficitur arcu.',
  'Can you make a custom video for my birthday?',
  'Sure, send me the details and I will get it done this week.',
  'That was amazing 🔥',
  'Love your latest post ❤️',
  'Haha, you are the best 😂',
  'When is the next live stream?',
  'I will be live on Friday at 8pm.',
  'Did you get my last message?',
  'Yes! Sorry for the late reply.',
  'Have a great weekend!',
  'Good morning ☀️',
  'Can we do a quick call tomorrow?',
  'Absolutely, what time works for you?',
  'Sending you the photos now.',
];

export function sentence(random: Random): string {
  return random.pick(SENTENCES);
}

export function paragraph(random: Random, min = 1, max = 3): string {
  return Array.from({ length: random.int(min, max) }, () => sentence(random)).join(' ');
}
