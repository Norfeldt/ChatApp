module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [
      'module:react-native-dotenv',
      'module:react-native-reanimated/plugin',
    ],
  }
}
