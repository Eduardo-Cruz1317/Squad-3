// Configuração do Jest (ferramenta de testes definida pela turma).
// O código em src/ é ESM e o projeto não usa "type": "module" (as funções da Vercel em api/ são CommonJS),
// então o babel-jest converte os módulos só durante os testes. Nada aqui afeta o build do Vite nem a Vercel.
//
// Arquivos *.spec.js rodam no Jest; os *.test.js antigos (node:test) continuam com `node --test`
// até cada squad migrar os seus.
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.spec.js'],
  transform: {
    '\\.[cm]?js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }],
  },
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: [
    'src/business/**/quests/**/*.js',
    'src/persistence/repositories/quests/**/*.js',
    'src/presentation/http/quests-route.js',
    'src/presentation/validation/quests.js',
    'api/_lib/quests-http.js',
  ],
};
