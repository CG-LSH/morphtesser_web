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
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = 'all';
    devServerConfig.host = '0.0.0.0';
    return devServerConfig;
  },
}; 