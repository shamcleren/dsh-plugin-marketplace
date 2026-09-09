import { describe, expect, it, vi } from 'vitest'
import { createMarketplaceRpcHandler } from '../src/rpc.ts'

describe('Marketplace RPC', () => {
  it('rejects unknown methods and malformed installation requests before mutation', async () => {
    const add = vi.fn()
    const handler = createMarketplaceRpcHandler({ add } as never, vi.fn())
    const signal = new AbortController().signal
    expect(await handler('constructor', {}, signal)).toMatchObject({ ok: false })
    expect(await handler('add', { packageName: 'ok', command: 'extra' }, signal)).toMatchObject({ ok: false })
    expect(add).not.toHaveBeenCalled()
  })
  it('calls the package installer using the catalog package identity', async () => {
    const add = vi.fn(async () => ({ packageName: 'demo', restartRequired: true }))
    const handler = createMarketplaceRpcHandler({ add } as never, vi.fn())
    expect(await handler('add', { packageName: 'demo' }, new AbortController().signal))
      .toMatchObject({ ok: true, value: { restartRequired: true } })
    expect(add).toHaveBeenCalledExactlyOnceWith('demo')
  })
})
