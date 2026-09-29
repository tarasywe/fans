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

// react-native-mmkv uses an in-memory mock under Jest, but still imports Nitro's native module.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn(), box: jest.fn() },
}));

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

// Native RevenueCat SDK: never selected under Jest (the simulated store is), but its modules are
// imported, so give them inert stand-ins.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: jest.fn(), setLogLevel: jest.fn(), getAppUserID: jest.fn() },
  LOG_LEVEL: { INFO: 'INFO', WARN: 'WARN' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));
jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: { Paywall: () => null, presentCustomerCenter: jest.fn() },
}));

// Native RevenueCat SDK: never selected under Jest (the simulated store is), but its modules are
// imported, so give them inert stand-ins.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { configure: jest.fn(), setLogLevel: jest.fn(), getAppUserID: jest.fn() },
  LOG_LEVEL: { INFO: 'INFO', WARN: 'WARN' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));
jest.mock('react-native-purchases-ui', () => ({
  __esModule: true,
  default: { Paywall: () => null, presentCustomerCenter: jest.fn() },
}));
