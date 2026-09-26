import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('@legendapp/list/react-native', () => require('./test/legend-list-mock'));

// UniWind's stylesheet is not compiled under Jest, so icon color classes resolve to "".
const originalWarn = console.warn;
jest.spyOn(console, 'warn').mockImplementation((message?: unknown, ...rest: unknown[]) => {
  if (typeof message === 'string' && message.includes('is not a valid color or brush')) return;
  originalWarn(message, ...rest);
});
