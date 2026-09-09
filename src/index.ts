/** Trusted Marketplace plugin using the upstream Connection RPC extension. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
import MarketplaceService from './service.ts'
import { createMarketplaceRpcHandler } from './rpc.ts'
export { parseMarketplaceCatalog } from './catalog.ts'
export type Config = import('./service.ts').Config
export const name = 'trusted-marketplace'
export const Config = MarketplaceService.Config
export const inject = ['credentials', 'webServer', 'connection']

/** Mount the service and browser RPC with Host-enforced loopback authorization. */
export function apply(ctx: Context, config: import('./service.ts').Config): void {
  ctx.plugin(MarketplaceService, config)
  ctx.inject(['trustedMarketplace', 'connection'], scope => {
    const service = scope.get('trustedMarketplace' as never) as unknown as MarketplaceService
    scope.connection.rpc.handle('/trusted-marketplace',
      createMarketplaceRpcHandler(service, error => { scope.logger('trusted-marketplace').error(error) }),
      { authority: 'loopback' })
  })
}
