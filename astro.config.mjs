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
  adapter: cloudflare(),
});