const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://server-kohl-psi.vercel.app';

/** @type {import('next').NextConfig} */
const NEXT_API = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const BE_PORT = process.env.BACKEND_PORT || '4000';
module.exports = {
  async rewrites() {
    if (NEXT_API && NEXT_API.startsWith('http')) return [];
    return [{ source: '/api/:path*', destination: `http://localhost:${BE_PORT}/api/:path*` }];
  },
};