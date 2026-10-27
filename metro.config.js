const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest(context, moduleName, platform) {
      // The package's react-native entry points at TS sources which Metro can
      // retain in its file map after a dependency change. Use its built entry.
      if (moduleName === 'react-native-render-html') {
        return context.resolveRequest(
          context,
          require.resolve('react-native-render-html/lib/commonjs/index.js'),
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
