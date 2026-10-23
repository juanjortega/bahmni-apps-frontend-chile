const nxPreset = require('@nx/jest/preset').default;

// Las pruebas de fechas y edades asumen UTC (como el CI). En una máquina con otra zona horaria
// (p. ej. America/Santiago) fallaban; los workers de jest heredan esta variable.
process.env.TZ = process.env.JEST_TZ || 'UTC';

module.exports = {
  ...nxPreset,
  // Fuera del CI, el hook de pre-commit lanza hasta 5 proyectos a la vez y cada jest tomaba
  // núcleos-1 workers (115 jsdom en una máquina de 24 núcleos): las pruebas vencían su espera
  // de 5 s y fallaban al azar. En el CI se mantiene el valor por defecto de jest.
  ...(process.env.CI
    ? {}
    : { maxWorkers: process.env.JEST_MAX_WORKERS || '20%' }),
  testEnvironment: 'jsdom',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  coverageReporters: ['html', 'text', 'lcov'],
};
