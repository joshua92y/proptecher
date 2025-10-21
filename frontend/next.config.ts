import type { NextConfig } from "next";

const nextConfig = {
  compiler: {
    styledComponents: {
      // styled-components v6 설정
      displayName: process.env.NODE_ENV === 'development',
      ssr: true,
      fileName: true,
      namespace: 'sc',
      topLevelImportPaths: true,
      meaninglessFileNames: ['index'],
      cssProp: true,
      pure: false,
    },
  },
  experimental: {
    optimizeCss: false, // CSS 최적화 비활성화 (styled-components와 충돌 가능성)
  },
};

module.exports = nextConfig;