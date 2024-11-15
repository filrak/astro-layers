import { describe, expect, it } from 'vitest'
import layers from '../src/index'

describe('astro-layers', () => {
  it('creates a valid astro integration', () => {
    const integration = layers()
    expect(integration.name).toBe('astro-layers')
    expect(integration.hooks).toBeDefined()
  })
})
