/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
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
