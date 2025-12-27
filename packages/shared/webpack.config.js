// Webpack configuration for handling SVG imports as React components
// This file should be imported and extended by the consuming application's webpack config

module.exports = {
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              icon: true,
              svgo: true,
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        // Keep viewBox for proper scaling
                        removeViewBox: false,
                        // Optimize for better performance
                        cleanupNumericValues: {
                          floatPrecision: 2,
                        },
                        convertColors: {
                          currentColor: false,
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  },
};