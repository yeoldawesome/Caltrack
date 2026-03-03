// @ts-check
const { getDefaultConfig } = require('expo/config');

/** @type {import('expo/config').ExpoConfig} */
const config = getDefaultConfig(__dirname);

config.plugins ??= [];
config.plugins.push([
  'expo-build-properties',
  {
    ios: {
      useFrameworks: 'static',
    },
  },
]);

module.exports = config;
