import { defineConfig } from 'astro'
import layers from '../dist/index.mjs' // Using the local plugin

export default defineConfig({
  integrations: [
    layers({
      // Your plugin options here
    })
  ]
}) 