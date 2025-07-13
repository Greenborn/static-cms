module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    // Reglas de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Reglas de variables
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-undef': 'error',
    
    // Reglas de funciones
    'no-console': 'warn',
    'no-debugger': 'error',
    
    // Reglas de objetos
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // Reglas de strings
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    
    // Reglas de promesas
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Reglas específicas del proyecto
    'camelcase': ['error', { 'properties': 'never' }],
    'max-len': ['error', { 'code': 100, 'ignoreUrls': true }],
    'comma-dangle': ['error', 'always-multiline'],
  },
  globals: {
    // Variables globales de Node.js
    'process': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly',
  },
}; 