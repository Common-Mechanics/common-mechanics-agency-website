import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  site: 'https://commonmechanics.io',
  // Static marketing site — no sessions are used at runtime. Override the
  // Cloudflare adapter's default, which otherwise wires an unprovisioned
  // "SESSION" KV binding and makes `wrangler deploy` try to create a KV
  // namespace on every deploy (fails with "already exists" on re-deploys).
  session: { driver: { entrypoint: 'unstorage/drivers/memory' } },
  // Keep every bundled asset — component <script>s above all — as a separate
  // file. Under Vite's default 4kB threshold Astro inlines small script
  // bundles straight into the HTML, and `script-src 'self'` in public/_headers
  // then blocks them: the portfolio hover previews and the logo-marquee pause
  // control silently stopped running in production while working fine in
  // `astro dev`. Raising this again means adding CSP hashes for the inlined
  // scripts, not loosening the policy.
  vite: { build: { assetsInlineLimit: 0 } },
  adapter: cloudflare(),
});