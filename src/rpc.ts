/** Validated public methods; installation remains restricted to the trusted catalog. */
import type { ConnectionRpcHandler } from '@deepseek-ai/dsh-client-connection'
import { z } from 'zod'
import type MarketplaceService from './service.ts'

type BrowserService = Pick<MarketplaceService, 'state' | 'catalog' | 'refreshCatalog' | 'configure' | 'add' | 'deletePackage' | 'beginOAuth' | 'oauthStatus' | 'repositories'>
const empty = z.strictObject({})
const packageRequest = z.strictObject({ packageName: z.string().min(1) })
const source = z.strictObject({ baseUrl: z.string().url(), repository: z.string().min(1), ref: z.string().min(1), token: z.string().optional() })
const oauth = z.strictObject({ baseUrl: z.string().url(), clientId: z.string().min(1) })

/** Create an allowlisted handler for the human-operated settings page. */
export function createMarketplaceRpcHandler(service: BrowserService, report: (error: unknown) => void): ConnectionRpcHandler {
  return async (endpoint, payload) => {
    try {
      let value: unknown
      switch (endpoint) {
        case 'state': empty.parse(payload); value = await service.state(); break
        case 'catalog': empty.parse(payload); value = await service.catalog(); break
        case 'refreshCatalog': empty.parse(payload); value = await service.refreshCatalog(); break
        case 'repositories': empty.parse(payload); value = await service.repositories(); break
        case 'configure': value = await service.configure(source.parse(payload)); break
        case 'add': value = await service.add(packageRequest.parse(payload).packageName); break
        case 'deletePackage': value = await service.deletePackage(packageRequest.parse(payload).packageName); break
        case 'beginOAuth': value = await service.beginOAuth(oauth.parse(payload)); break
        case 'oauthStatus': value = await service.oauthStatus(z.strictObject({ flowId: z.string().min(1) }).parse(payload).flowId); break
        default: return { ok: false, error: { code: 'bad-request', message: 'Unknown Marketplace operation', details: {} } }
      }
      return { ok: true, value }
    } catch (error) {
      report(error)
      return { ok: false, error: { code: error instanceof z.ZodError ? 'bad-request' : 'internal',
        message: error instanceof z.ZodError ? 'Invalid Marketplace request' : 'Marketplace operation failed; check the Host log.',
        details: {} } }
    }
  }
}
