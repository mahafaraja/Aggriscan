const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Forces the bundler to resolve modules safely for older Android engine layouts
config.resolver.unstable_enablePackageExports = false;

// Register `.tflite` as a custom asset extension so Metro can bundle
// TensorFlow Lite models via `require('...model.tflite')`.
// Required by react-native-fast-tflite.
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'tflite');
config.resolver.assetExts.push('tflite');

module.exports = config;
