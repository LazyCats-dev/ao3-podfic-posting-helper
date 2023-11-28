module.exports = {
  transform: {
    '.+\\.ts$': 'ts-jest',
  },
  testRegex: '/tests/.*',
  moduleFileExtensions: ['ts', 'js'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
