import { describe, expect, it } from 'vitest'
import { TYPERT } from '../typert/host.js'

describe('Marketplace Typert manifest', () => {
  it('is owned by the external package and exposes the complete browser API', () => {
    expect(TYPERT.package).toBe('@shamcleren/dsh-plugin-marketplace')
    expect(TYPERT.invocations.map(invocation => `${invocation.namespace}/${invocation.method}`).sort()).toEqual([
      'marketplace/add',
      'marketplace/beginOAuth',
      'marketplace/catalog',
      'marketplace/configure',
      'marketplace/deletePackage',
      'marketplace/oauthStatus',
      'marketplace/refreshCatalog',
      'marketplace/repositories',
      'marketplace/state',
    ])
  })
})
