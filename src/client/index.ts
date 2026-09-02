/** External Marketplace browser contribution. */

import { createElement } from 'react'
import { MarketplacePanel } from './MarketplacePanel.tsx'
import { en, zh, type LocaleKey } from './locales.ts'
import type { MarketplaceRemote } from './types.ts'

const namespace = 'settings.marketplace.external'

type RpcResponse<T> = { ok: true; value: T } | { ok: false; error: { code: string; message: string } }
type RemoteFace = { [K in keyof MarketplaceRemote]: MarketplaceRemote[K] extends (...args: infer A) => Promise<infer R>
  ? (...args: A) => Promise<RpcResponse<R>>
  : never }

interface ClientContext {
  effect(callback: () => unknown, label?: string): void
  locale: {
    register(namespace: string, dictionaries: { zh: Record<string, string>; en: Record<string, string> }): unknown
    bind(namespace: string): (key: LocaleKey) => string
  }
  remote: { marketplace: RemoteFace }
  slots: {
    inject(slot: string, register: () => unknown): void
    register(meta: Record<string, unknown>, component: (props?: unknown) => unknown): unknown
  }
}

export const name = '@shamcleren/dsh-plugin-marketplace'
export const inject = ['slots', 'locale', 'remote', 'remote.marketplace']

function unwrap<T>(response: Promise<RpcResponse<T>>): Promise<T> {
  return response.then((result) => {
    if (result.ok) return result.value
    throw new Error(`${result.error.code}: ${result.error.message}`)
  })
}

/** Register one replacement Marketplace tab backed by the trusted Host service. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(namespace, { zh, en }), 'external-marketplace: dictionaries')
  const t = ctx.locale.bind(namespace)
  const remote: MarketplaceRemote = {
    state: () => unwrap(ctx.remote.marketplace.state()),
    catalog: () => unwrap(ctx.remote.marketplace.catalog()),
    refreshCatalog: () => unwrap(ctx.remote.marketplace.refreshCatalog()),
    configure: request => unwrap(ctx.remote.marketplace.configure(request)),
    add: packageName => unwrap(ctx.remote.marketplace.add(packageName)),
    deletePackage: packageName => unwrap(ctx.remote.marketplace.deletePackage(packageName)),
    beginOAuth: request => unwrap(ctx.remote.marketplace.beginOAuth(request)),
    oauthStatus: flowId => unwrap(ctx.remote.marketplace.oauthStatus(flowId)),
    repositories: () => unwrap(ctx.remote.marketplace.repositories()),
  }
  ctx.slots.inject('settings.plugins.tab', () => ctx.slots.register({
    name: 'settings.plugins.tab',
    id: 'marketplace',
    order: 10,
    label: () => t('tab'),
    locale: namespace,
  }, () => createElement(MarketplacePanel, { remote, t })))
}
