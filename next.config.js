/** @type {import('next').NextConfig} */
const path = require('path')

// React paths for aliasing (used by both webpack and turbopack)
const reactPath = path.resolve(__dirname, 'node_modules', 'react')
const reactDomPath = path.resolve(__dirname, 'node_modules', 'react-dom')

const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'your-backend.vercel.app',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ]
  },
  webpack: (config, { isServer, webpack }) => {
    // Ensure single React instance to prevent hook errors
    // Critical: Apply aliases to ensure ALL code (including Next.js devtools) uses same React instance
    // Force React resolution - CRITICAL: These must override ALL other React resolutions
    // This ensures Next.js devtools, app code, and all dependencies use the same React instance
    const reactAliases = {
      'react': reactPath,
      'react-dom': reactDomPath,
      'react/jsx-runtime': path.resolve(reactPath, 'jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(reactPath, 'jsx-dev-runtime'),
    }
    
    // CRITICAL: React aliases must be applied FIRST, then merge existing aliases
    // This ensures our React instance takes precedence over any other resolution
    config.resolve.alias = {
      ...reactAliases,
      ...config.resolve.alias,
      // Re-apply React aliases after merging to ensure they win
      ...reactAliases,
    }
    
    // Ensure React is not duplicated in node_modules resolution
    // Put our node_modules first to ensure we get the correct React
    const nodeModulesPath = path.resolve(__dirname, 'node_modules')
    config.resolve.modules = [
      nodeModulesPath,
      ...(Array.isArray(config.resolve.modules) 
        ? config.resolve.modules.filter((mod) => mod !== nodeModulesPath)
        : []),
    ]
    
    // Fix for module resolution issues (client-side only)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Fix for react-syntax-highlighter refractor module resolution
    // Ignore all refractor language imports since we use highlight.js, not Prism
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^refractor\/lang\/.*$/,
        contextRegExp: /react-syntax-highlighter/,
      })
    )
    
    // Also ignore Prism async language loaders
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /react-syntax-highlighter\/dist\/esm\/async-languages\/prism/,
      })
    )
    
    return config
  },
  // External packages for server components (Node.js runtime only, not Edge)
  serverExternalPackages: ['next-auth', 'pg', 'pg-native'],
  // Turbopack configuration for Next.js 16
  // Note: Turbopack handles React resolution automatically in Next.js 16
  // We only need minimal config - the webpack config handles React aliases for webpack builds
  turbopack: {},
}

module.exports = nextConfig