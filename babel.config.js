module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource routes JSX through NativeWind so `className` works on RN components.
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // NOTE (Android dev): no `plugins` list on purpose. babel-preset-expo auto-injects
    // `react-native-worklets/plugin` (the Reanimated 4 worklet transform) when the package
    // is installed, and guarantees it runs last. Unlike a Gradle annotation processor there's
    // no separate build step — this Babel pass IS the worklet compiler.
  };
};
