import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Suppress bigint-buffer native addon warning on Windows.
  // The pure JS fallback works identically for devnet usage.
  serverExternalPackages: ['bigint-buffer'],
}

export default nextConfig
