import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async redirects() {
    return [{ source: '/places/spot/3353336', destination: '/places/spot/2774564', statusCode: 301 }];
  },
  async rewrites() {
    // Keep existing query URLs and server-rendered results. Query-free landing
    // pages can then use the CDN without a function invocation.
    return { beforeFiles: [
      ...['q', 'category', 'cooking', 'page'].map(key => ({
        source: '/weekend-prep',
        has: [{ type: 'query', key, value: '.*' }],
        destination: '/weekend-prep/filter',
      })),
      { source: '/search', has: [{ type: 'query', key: 'q', value: '.*' }], destination: '/search/results' },
    ] };
  },
  images: {
    // 관광·행사 원본은 자주 바뀌지 않는다. 변환 캐시를 Vercel 권장
    // 장기 값으로 유지하고, 실제 레이아웃 최대 폭을 넘는 1920~3840px
    // 파생본은 생성하지 않아 transformation/cache-write 사용량을 줄인다.
    minimumCacheTTL: 2678400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    // 문화포털 포스터 이미지는 http(www.culture.go.kr)로 제공됨
    remotePatterns: [
      { protocol: "http", hostname: "www.culture.go.kr" },
      { protocol: "https", hostname: "www.culture.go.kr" },
      { protocol: "http", hostname: "culture.go.kr" },
      { protocol: "https", hostname: "culture.go.kr" },
      // 한국관광공사 TourAPI 이미지
      { protocol: "http", hostname: "tong.visitkorea.or.kr" },
      { protocol: "https", hostname: "tong.visitkorea.or.kr" },
    ],
    // 원본 포스터 비율이 제각각이라 최적화 시 여유있게
    formats: ["image/webp"],
  },
};

export default nextConfig;
