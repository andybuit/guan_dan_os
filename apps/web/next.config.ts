import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add turbopack config to silence the warning
  turbopack: {
    // Turbopack configuration goes here
    // Currently empty as we're using webpack for SVG handling
  },
  webpack(config) {
    // Handle SVG imports as React components
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
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
    });

    // Also add a rule for SVGs in CSS files
    config.module.rules.push({
      test: /\.svg$/i,
      type: 'asset',
      resourceQuery: /url/, // *.svg?url
    });

    return config;
  },
};

export default nextConfig;
