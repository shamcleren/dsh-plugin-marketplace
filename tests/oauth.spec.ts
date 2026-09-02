import type { CredentialProvider } from '@deepseek-ai/dsh-credentials'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GongfengOAuthController, pkceChallenge, validateOAuthBaseUrl } from '../src/oauth.ts'

const credentials = {} as CredentialProvider

afterEach(() => { vi.restoreAllMocks() })

describe('GongfengOAuthController', () => {
  it('builds unique S256 authorization requests without a client secret', () => {
    const controller = new GongfengOAuthController(credentials, async () => undefined)
    const config = {
      baseUrl: 'https://git.woa.com/',
      clientId: '78a69ee90433425fbd1cad0fe687c2e6',
      redirectUri: 'http://127.0.0.1:3080/oauth/gongfeng/callback',
      accessTokenRef: 'GONGFENG_OAUTH_ACCESS_TOKEN',
      refreshTokenRef: 'GONGFENG_OAUTH_REFRESH_TOKEN',
    }
    const first = controller.begin(config)
    const second = controller.begin(config)
    const url = new URL(first.authorizationUrl)
    expect(url.origin).toBe('https://git.woa.com')
    expect(url.searchParams.get('client_id')).toBe(config.clientId)
    expect(url.searchParams.get('redirect_uri')).toBe(config.redirectUri)
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.searchParams.has('client_secret')).toBe(false)
    expect(first.flowId).not.toBe(second.flowId)
    expect(url.searchParams.get('state')).not.toBe(new URL(second.authorizationUrl).searchParams.get('state'))
  })

  it('uses URL-safe unpadded S256 challenges', () => {
    expect(pkceChallenge('a'.repeat(43))).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it('exchanges a valid callback without a client secret and stores both tokens', async () => {
    const stored = new Map<string, string>()
    const provider = {
      resolve: async (ref: string) => stored.has(ref) ? { value: stored.get(ref)!, source: 'test' } : undefined,
      set: async (ref: string, value: string) => { stored.set(ref, value) },
    } as unknown as CredentialProvider
    const updateExpiry = vi.fn(async () => undefined)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      access_token: 'access-value', refresh_token: 'refresh-value', expires_in: 7200,
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    const controller = new GongfengOAuthController(provider, updateExpiry)
    const flow = controller.begin({
      baseUrl: 'https://git.woa.com/', clientId: '78a69ee90433425fbd1cad0fe687c2e6',
      redirectUri: 'http://127.0.0.1:3080/oauth/gongfeng/callback',
      accessTokenRef: 'GONGFENG_OAUTH_ACCESS_TOKEN', refreshTokenRef: 'GONGFENG_OAUTH_REFRESH_TOKEN',
    })
    const state = new URL(flow.authorizationUrl).searchParams.get('state')!
    await controller.callback(new URL(`http://127.0.0.1:3080/oauth/gongfeng/callback?code=code-value&state=${state}`))
    const request = vi.mocked(globalThis.fetch).mock.calls[0]
    const body = request?.[1]?.body
    expect(body).toBeInstanceOf(URLSearchParams)
    expect((body as URLSearchParams).has('client_secret')).toBe(false)
    expect(stored.get('GONGFENG_OAUTH_ACCESS_TOKEN')).toBe('access-value')
    expect(stored.get('GONGFENG_OAUTH_REFRESH_TOKEN')).toBe('refresh-value')
    expect(controller.status(flow.flowId)).toEqual({ status: 'complete' })
    expect(updateExpiry).toHaveBeenCalledOnce()
  })

  it('turns a denied callback into an immediate poll failure', async () => {
    const controller = new GongfengOAuthController(credentials, async () => undefined)
    const flow = controller.begin({
      baseUrl: 'https://git.woa.com/', clientId: '78a69ee90433425fbd1cad0fe687c2e6',
      redirectUri: 'http://127.0.0.1:3080/oauth/gongfeng/callback',
      accessTokenRef: 'GONGFENG_OAUTH_ACCESS_TOKEN', refreshTokenRef: 'GONGFENG_OAUTH_REFRESH_TOKEN',
    })
    const state = new URL(flow.authorizationUrl).searchParams.get('state')!
    await expect(controller.callback(new URL(
      `http://127.0.0.1:3080/oauth/gongfeng/callback?error=access_denied&state=${state}`,
    ))).rejects.toThrow(/missing code/)
    expect(controller.status(flow.flowId)).toMatchObject({ status: 'failed' })
  })

  it.each([
    'http://git.woa.com/',
    'https://user:secret@git.woa.com/',
    'https://git.woa.com/path',
  ])('rejects unsafe OAuth base URL %s', (url) => {
    expect(() => validateOAuthBaseUrl(url)).toThrow(/HTTPS origin/)
  })

  it.each([
    ['15', 'marketplace Gongfeng API rate limit exceeded; retry after 15 seconds'],
    [undefined, 'marketplace Gongfeng API rate limit exceeded; wait before retrying'],
  ])('reports Gongfeng rate limits without exposing the upstream response body', async (retryAfter, message) => {
    const provider = {
      resolve: async () => ({ value: 'access-value', source: 'test' }),
    } as unknown as CredentialProvider
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      status: 429, message: 'too many request', user_name: 'private-user', trace_id: 'private-trace',
    }), { status: 429, ...retryAfter === undefined ? {} : { headers: { 'retry-after': retryAfter } } }))
    const controller = new GongfengOAuthController(provider, async () => undefined)
    const request = {
      config: {
        baseUrl: 'https://git.woa.com/', clientId: '78a69ee90433425fbd1cad0fe687c2e6',
        redirectUri: 'http://127.0.0.1:3080/oauth/gongfeng/callback',
        accessTokenRef: 'GONGFENG_OAUTH_ACCESS_TOKEN', refreshTokenRef: 'GONGFENG_OAUTH_REFRESH_TOKEN',
      },
      repository: 'shamcleren/dsh-plugin', path: 'marketplace.json', ref: 'main', maxBytes: 1024,
    }
    await expect(controller.repositoryFile(request)).rejects.toThrow(new RegExp(`^${message}$`, 'u'))
  })
})
