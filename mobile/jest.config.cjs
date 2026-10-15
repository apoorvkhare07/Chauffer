module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.tsx"],
  moduleNameMapper: {
    "^react$": "<rootDir>/node_modules/react",
    "^react/(.*)$": "<rootDir>/node_modules/react/$1",
    "^react-native$": "<rootDir>/node_modules/react-native",
    "^convex/(.*)$": "<rootDir>/node_modules/convex/$1",
  },
};
