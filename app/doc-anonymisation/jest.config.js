
/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

};