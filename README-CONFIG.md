Frontend configuration (important)
- Set environment variable in Vercel (project web-mocha-eight-45):
  NEXT_PUBLIC_API_BASE_URL=https://server-kohl-psi.vercel.app
- After updating env vars, redeploy frontend in Vercel so the env is baked into build.
- For local dev, you can set NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 (or to the remote server).
- Check browser console and Network tab for CORS or 4xx/5xx errors if API calls fail.
