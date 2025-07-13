module.exports = {
  // Entorno de testing
  testEnvironment: 'node',
  
  // Directorios de test
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  // Cobertura de código
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/config/database.js',
    '!src/app.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Setup y teardown
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  
  // Timeout para tests
  testTimeout: 10000,
  
  // Variables de entorno para testing
  setupFiles: ['<rootDir>/src/__tests__/env.js'],
  
  // Transformaciones
  transform: {},
  
  // Módulos para mock
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Configuración de verbose
  verbose: true,
  
  // Configuración de watch
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ]
}; 