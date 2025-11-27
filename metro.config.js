const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require("nativewind/metro");

const {
    withSentryConfig
} = require("@sentry/react-native/metro");
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = mergeConfig(getDefaultConfig(__dirname), {})
// const config = {};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);
module.exports = withSentryConfig(withNativeWind(config, { input: "./global.css" }));
