const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Forces the bundler to resolve modules safely for older Android engine layouts
config.resolver.unstable_enablePackageExports = false;

// Transpile node_modules that use modern JS syntax (optional chaining)
// This fixes the "Unexpected token: punc (.)" error in React Native core during minification
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Ensure node_modules are properly transpiled
config.resolver.blockList = undefined;

module.exports = config;
