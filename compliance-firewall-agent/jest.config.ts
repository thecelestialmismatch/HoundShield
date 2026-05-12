import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/lib", "<rootDir>/app"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^lucide-react$": "<rootDir>/lib/__mocks__/lucide-react.ts",
  },
  collectCoverageFrom: [
    "lib/**/*.ts",
    "app/pricing/_data.ts",
    "!lib/**/__tests__/**",
    "!lib/**/__mocks__/**",
    "!lib/**/*.d.ts",
  ],
  coverageThreshold: {
    global: { branches: 70, functions: 70, lines: 70, statements: 70 },
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { module: "commonjs" } }],
  },
};

export default config;
