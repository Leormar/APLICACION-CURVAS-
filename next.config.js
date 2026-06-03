const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://appleid.cdn-apple.com https://appleid.apple.com https://translate.google.com https://translate.googleapis.com https://www.gstatic.com https://www.google.com",
  "style-src 'self' 'unsafe-inline' https://appleid.cdn-apple.com https://appleid.apple.com https://www.gstatic.com https://fonts.googleapis.com",
  "font-src 'self' data: https://appleid.cdn-apple.com https://appleid.apple.com https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://appleid.apple.com https://appleid.cdn-apple.com https://translate.googleapis.com https://translate.google.com",
  "frame-src 'self' https://appleid.apple.com https://appleid.cdn-apple.com https://translate.google.com",
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
