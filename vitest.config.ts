import { defineConfig } from 'vitest/config'
import { workers } from '@cloudflare/vitest-pool-workers/config'

export default defineConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
      },
    },
  },
  ...workers,
})
