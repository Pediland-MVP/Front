import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "pcfcdn.kommo.com",
      },
      {
        protocol: "https",
        hostname: "miro.medium.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "koochaa-cdn.s3.**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "koochaa-cdn.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "cdn.zarinpal.com",
      },
      {
        protocol: "https",
        hostname: "befroosh.app",
      },
      {
        protocol: "https",
        hostname: "befroosh.s3.ir-thr-at1.arvanstorage.ir",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default withNextIntl(nextConfig);
