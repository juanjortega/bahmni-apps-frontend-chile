const nxPreset = require('@nx/jest/preset').default;

// Las pruebas de fechas y edades asumen UTC (como el CI). En una máquina con otra zona horaria
// (p. ej. America/Santiago) fallaban; los workers de jest heredan esta variable.
process.env.TZ = process.env.JEST_TZ || 'UTC';

module.exports = {
  ...nxPreset,
  testEnvironment: 'jsdom',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  coverageReporters: ['html', 'text', 'lcov'],
};
