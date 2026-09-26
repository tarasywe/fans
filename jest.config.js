/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.ts'],
  testMatch: ['**/?(*.)test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/css-stub.js',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@ui/(.*)$': '<rootDir>/src/components/ui/$1',
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|@gluestack-ui/.*|@legendapp/.*|uniwind|tailwind-variants|react-aria|@react-aria/.*|react-stately|@react-stately/.*|@internationalized/.*|@tanstack/.*|standard-navigation))',
  ],
};
