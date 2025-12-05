const { jestConfig } = require('@irfanandriansyah1997/jest/jest/index.cjs');

module.exports = jestConfig({
  baseDir: __dirname,
  config: {
    moduleNameMapper: {
      '@/(.*)$': '<rootDir>/src/$1'
    },
    prettierPath: require.resolve('prettier-2'),
    setupFiles: [],
    setupFilesAfterEnv: ['<rootDir>/src/setup-test.ts']
  }
});
