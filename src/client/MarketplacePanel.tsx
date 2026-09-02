import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { type CatalogFilter, pluginRows, visibleRows } from './model.ts'
import { requestNativeOpen, requestNativeRestart } from './native.ts'
import type { LocaleKey } from './locales.ts'
import type { CatalogView, MarketplaceRemote, MarketplaceState, Repository } from './types.ts'
import css from './MarketplacePanel.module.css'

interface Props {
  readonly remote: MarketplaceRemote
  readonly t: (key: LocaleKey) => string
}

type View = 'catalog' | 'installed'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Trusted catalog and installed-plugin management UI. */
export function MarketplacePanel({ remote, t }: Props): ReactNode {
  const [view, setView] = useState<View>('catalog')
  const [filter, setFilter] = useState<CatalogFilter>('all')
  const [query, setQuery] = useState('')
  const [state, setState] = useState<MarketplaceState>()
  const [catalog, setCatalog] = useState<CatalogView>()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [editing, setEditing] = useState(false)
  const [baseUrl, setBaseUrl] = useState('https://git.woa.com/')
  const [repository, setRepository] = useState('shamcleren/dsh-plugin')
  const [ref, setRef] = useState('main')
  const [token, setToken] = useState('')
  const [oauthClientId, setOauthClientId] = useState('78a69ee90433425fbd1cad0fe687c2e6')
  const [busy, setBusy] = useState<string>()
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()
  const [restartPending, setRestartPending] = useState(false)

  const load = useCallback(async (refreshCatalog: boolean): Promise<void> => {
    setError(undefined)
    const nextState = await remote.state()
    setState(nextState)
    setBaseUrl(nextState.baseUrl)
    setRepository(nextState.repository)
    setRef(nextState.ref)
    setOauthClientId(nextState.oauthClientId ?? '')
    if (nextState.tokenConfigured) setCatalog(await (refreshCatalog ? remote.refreshCatalog() : remote.catalog()))
    else setCatalog(undefined)
  }, [remote])

  useEffect(() => {
    void load(false).catch((failure: unknown) => { setError(errorMessage(failure)) })
  }, [load])

  const rows = useMemo(() => pluginRows(catalog?.plugins ?? [], state?.installed ?? []), [catalog, state])
  const updates = useMemo(() => rows.filter(row => row.updateAvailable), [rows])
  const visible = useMemo(() => visibleRows(rows, query, filter), [filter, query, rows])
  const installedRows = useMemo(() => rows.filter(row => row.installed !== undefined), [rows])
  const unknownInstalled = useMemo(() => (state?.installed ?? []).filter(entry => !rows.some(row => row.installed?.packageName === entry.packageName)), [rows, state])

  const mutate = async (key: string, operation: () => Promise<unknown>): Promise<void> => {
    setBusy(key)
    setError(undefined)
    try {
      await operation()
      setRestartPending(true)
      setNotice(t('restartPending'))
      await load(false)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(undefined)
    }
  }

  const refreshRemoteCatalog = async (): Promise<void> => {
    setBusy('refresh')
    setError(undefined)
    try {
      await load(true)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(undefined)
    }
  }

  const updateAll = async (): Promise<void> => {
    setBusy('update-all')
    setError(undefined)
    let completed = 0
    try {
      for (const row of updates) {
        await remote.add(row.plugin.packageName)
        completed += 1
      }
    } catch (failure) {
      setError(`${t('partialUpdate')} ${errorMessage(failure)}`)
    } finally {
      if (completed > 0) {
        setRestartPending(true)
        setNotice(t('restartPending'))
        await load(false).catch((failure: unknown) => { setError(errorMessage(failure)) })
      }
      setBusy(undefined)
    }
  }

  const openSettings = async (): Promise<void> => {
    const opening = !editing
    setEditing(opening)
    if (opening && state?.authMode === 'oauth' && repositories.length === 0) {
      try {
        setRepositories(await remote.repositories())
      } catch (failure) {
        setError(errorMessage(failure))
      }
    }
  }

  const saveSource = async (): Promise<void> => {
    setBusy('source')
    setError(undefined)
    try {
      await remote.configure({ baseUrl, repository, ref, ...(token.trim() === '' ? {} : { token }) })
      setToken('')
      await load(true)
      setEditing(false)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(undefined)
    }
  }

  const startOAuth = async (): Promise<void> => {
    setBusy('oauth')
    setError(undefined)
    try {
      const flow = await remote.beginOAuth({ baseUrl, clientId: oauthClientId })
      if (!requestNativeOpen(flow.authorizationUrl)) window.open(flow.authorizationUrl, '_blank', 'noopener,noreferrer')
      for (let attempt = 0; attempt < 800; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 750))
        const status = await remote.oauthStatus(flow.flowId)
        if (status.status === 'pending') continue
        if (status.status === 'failed') throw new Error(status.message)
        const available = await remote.repositories()
        setRepositories(available)
        const selected = available.find(entry => entry.path === repository) ?? available[0]
        if (selected !== undefined) {
          setRepository(selected.path)
          if (selected.defaultBranch !== undefined) setRef(selected.defaultBranch)
        }
        setNotice(t('oauthConnected'))
        return
      }
      throw new Error(t('oauthExpired'))
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(undefined)
    }
  }

  const restart = (): void => {
    if (requestNativeRestart()) setNotice(t('restartSent'))
  }

  return <section className={css.root} aria-busy={busy !== undefined}>
    <header className={css.sourceCard}>
      <div>
        <div className={css.eyebrow}>{t('source')}</div>
        <strong>{state?.repository ?? repository}</strong>
        <div className={css.muted}>{state?.tokenConfigured === true ? t('connected') : t('disconnected')} · {t('sourceSummary')}</div>
      </div>
      <div className={css.actions}>
        <button type="button" onClick={() => { void openSettings() }}>{t('configure')}</button>
        <button type="button" disabled={busy !== undefined || state?.tokenConfigured !== true} onClick={() => { void refreshRemoteCatalog() }}>{busy === 'refresh' ? t('working') : t('refresh')}</button>
      </div>
    </header>

    {editing || state?.tokenConfigured !== true ? <div className={css.sourceForm}>
      <label>{t('baseUrl')}<input value={baseUrl} onChange={event => { setBaseUrl(event.currentTarget.value) }} /></label>
      <label>{t('oauthClientId')}<input value={oauthClientId} onChange={event => { setOauthClientId(event.currentTarget.value) }} /></label>
      <button type="button" disabled={busy !== undefined || oauthClientId.trim() === ''} onClick={() => { void startOAuth() }}>{t('oauthLogin')}</button>
      <label>{t('repository')}{repositories.length === 0
        ? <input value={repository} onChange={event => { setRepository(event.currentTarget.value) }} />
        : <select value={repository} onChange={event => {
          const selected = repositories.find(entry => entry.path === event.currentTarget.value)
          setRepository(event.currentTarget.value)
          if (selected?.defaultBranch !== undefined) setRef(selected.defaultBranch)
        }}>{repositories.map(entry => <option key={entry.id} value={entry.path}>{entry.path}</option>)}</select>}</label>
      <label>{t('ref')}<input value={ref} onChange={event => { setRef(event.currentTarget.value) }} /></label>
      <label>{t('token')}<input type="password" value={token} placeholder={t('tokenHint')} onChange={event => { setToken(event.currentTarget.value) }} /></label>
      <button type="button" disabled={busy !== undefined} onClick={() => { void saveSource() }}>{state?.authMode === 'oauth' ? t('save') : t('connectToken')}</button>
    </div> : null}

    <div className={css.stats} aria-label={t('tab')}>
      <div><span>{t('catalogCount')}</span><strong>{rows.length}</strong></div>
      <div><span>{t('installedCount')}</span><strong>{(state?.installed ?? []).length}</strong></div>
      <div><span>{t('updateCount')}</span><strong>{updates.length}</strong></div>
    </div>

    <div className={css.tabs} role="tablist">
      <button type="button" role="tab" aria-selected={view === 'catalog'} data-active={view === 'catalog' || undefined} onClick={() => { setView('catalog') }}>{t('available')}</button>
      <button type="button" role="tab" aria-selected={view === 'installed'} data-active={view === 'installed' || undefined} onClick={() => { setView('installed') }}>{t('installed')}</button>
    </div>

    {error === undefined ? null : <div className={css.error} role="alert"><span><strong>{t('error')}:</strong> {error}</span><button type="button" onClick={() => { void load(false).catch((failure: unknown) => { setError(errorMessage(failure)) }) }}>{t('retry')}</button></div>}
    {notice === undefined ? null : <div className={css.notice}><span>{notice}</span>{restartPending && state?.nativeRestartAvailable === true ? <button type="button" onClick={restart}>{t('restartNow')}</button> : null}</div>}

    {view === 'catalog' ? <>
      <div className={css.toolbar}>
        <input type="search" value={query} placeholder={t('search')} onChange={event => { setQuery(event.currentTarget.value) }} />
        <select value={filter} onChange={event => { setFilter(event.currentTarget.value as CatalogFilter) }} aria-label={t('compatible')}>
          <option value="all">{t('all')}</option><option value="compatible">{t('compatible')}</option><option value="updates">{t('updates')}</option>
        </select>
        <button type="button" disabled={updates.length === 0 || busy !== undefined} onClick={() => { void updateAll() }}>{busy === 'update-all' ? t('working') : `${t('updateAll')} (${updates.length})`}</button>
      </div>
      {visible.length === 0 ? <p className={css.empty}>{t('empty')}</p> : <ul className={css.grid}>{visible.map(row => <li key={row.plugin.packageName} className={css.pluginCard}>
        <div className={css.pluginHeader}><strong>{row.plugin.name}</strong>{row.installed === undefined ? null : <span className={css.badge}>{t('installedTag')}</span>}</div>
        <p>{row.plugin.description}</p>
        <code>{row.plugin.packageName}</code>
        <div className={css.meta}><span>v{row.plugin.version}</span><span>{row.plugin.dshVersion}</span></div>
        <div className={css.cardFooter}>
          {row.plugin.compatible ? null : <span className={css.incompatible}>{t('incompatible')}</span>}
          <button type="button" disabled={!row.plugin.compatible || row.installed?.version === row.plugin.version || busy !== undefined} onClick={() => { void mutate(row.plugin.packageName, () => remote.add(row.plugin.packageName)) }}>
            {busy === row.plugin.packageName ? t('working') : row.installed === undefined ? t('install') : t('update')}
          </button>
        </div>
      </li>)}</ul>}
    </> : installedRows.length === 0 && unknownInstalled.length === 0 ? <p className={css.empty}>{t('emptyInstalled')}</p> : <ul className={css.list}>
      {installedRows.map(row => <li key={row.plugin.packageName}>
        <div><strong>{row.plugin.name}</strong><code>{row.plugin.packageName} · {row.installed?.version ?? row.installed?.specifier}</code></div>
        <div className={css.actions}>{row.updateAvailable ? <button type="button" disabled={busy !== undefined} onClick={() => { void mutate(row.plugin.packageName, () => remote.add(row.plugin.packageName)) }}>{t('update')}</button> : null}<button className={css.danger} type="button" disabled={busy !== undefined} onClick={() => {
          if (window.confirm(t('confirmRemove'))) void mutate(row.plugin.packageName, () => remote.deletePackage(row.plugin.packageName))
        }}>{busy === row.plugin.packageName ? t('removing') : t('remove')}</button></div>
      </li>)}
      {unknownInstalled.map(entry => <li key={entry.packageName}><div><strong>{entry.packageName}</strong><code>{entry.version ?? entry.specifier}</code></div></li>)}
    </ul>}
  </section>
}
