/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import { type Config } from "jest";

export default {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testEnvironment: "jest-environment-node",
  testMatch: ["<rootDir>/src/**/*.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/coverage/"],
  transform: {
    "^.+\\.m?[tj]sx?$": "./jest-transform.js",
  },
} satisfies Config;
