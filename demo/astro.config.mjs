import { defineConfig } from 'astro/config'
import layers from '../src/index.ts' // Using the local plugin

export default defineConfig({
  integrations: [
    layers({
      // Your plugin options here
    })
  ]
}) 