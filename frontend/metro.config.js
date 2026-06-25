const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Forces the bundler to resolve modules safely for older Android engine layouts
config.resolver.unstable_enablePackageExports = false;

module.exports = config;