const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://appleid.cdn-apple.com https://appleid.apple.com",
  "style-src 'self' 'unsafe-inline' https://appleid.cdn-apple.com https://appleid.apple.com",
  "font-src 'self' data: https://appleid.cdn-apple.com https://appleid.apple.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://appleid.apple.com https://appleid.cdn-apple.com",
  "frame-src 'self' https://appleid.apple.com https://appleid.cdn-apple.com",
  "form-action 'self' https://appleid.apple.com",
].join('; ')

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
        ],
      },
    ]
  },
}

module.exports = nextConfig
