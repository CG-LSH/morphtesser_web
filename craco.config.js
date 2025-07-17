module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        {
          module: /@mediapipe\/tasks-vision/,
        },
      ];
      return webpackConfig;
    },
  },
}; 