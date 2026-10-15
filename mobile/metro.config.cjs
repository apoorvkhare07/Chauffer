const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const config = getDefaultConfig(__dirname);
// This is a nested package, deliberately not an npm workspace. Parent imports
// are limited to the generated public API and pure shared clothing vocabulary.
config.watchFolders = [path.resolve(__dirname, "..")];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
const singletons = [
  "react",
  "react-dom",
  "react-native",
  "convex",
  "@convex-dev/auth",
];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    singletons.some(
      (name) => moduleName === name || moduleName.startsWith(`${name}/`),
    )
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(__dirname, "package.json") },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
