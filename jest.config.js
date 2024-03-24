/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
   preset: 'ts-jest',
   testEnvironment: 'jsdom',
   testMatch: ['**/__tests__/**/*.ts?(x)'],
   moduleDirectories: ['node_modules', '<rootDir>/node_modules', '.'],
   transform: {
      '^.+\\.(js|ts|tsx)$': 'ts-jest'
   },
   transformIgnorePatterns: [
      '/node_modules/(?![@autofiy/autofiyable|@autofiy/property]).+\\.js$',
      '/node_modules/(?![@autofiy/autofiyable|@autofiy/property]).+\\.ts$',
      '/node_modules/(?![@autofiy/autofiyable|@autofiy/property]).+\\.tsx$'
   ]
};
