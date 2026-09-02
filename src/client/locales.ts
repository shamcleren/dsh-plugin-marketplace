export const zh = {
  tab: '插件市场', source: '可信来源', connected: '已连接', disconnected: '需要连接', configure: '来源设置', refresh: '刷新目录',
  installed: '已安装', available: '目录插件', compatible: '兼容', updates: '可更新', search: '搜索名称、包名或描述', all: '全部',
  install: '安装', update: '更新', updateAll: '更新全部', remove: '卸载', removing: '正在卸载…', working: '处理中…',
  installedTag: '已安装', incompatible: '当前 DSH 版本不兼容', empty: '没有符合条件的插件。', emptyInstalled: '当前 profile 没有安装目录中的插件。',
  restartPending: '变更已经写入 profile；完成本轮操作后统一重启即可生效。', restartNow: '立即重启', restartSent: '已请求原生 Host 重启。',
  error: '操作失败', retry: '重试', sourceSummary: '单一可信仓库 · 摘要校验 · 安装脚本禁用', baseUrl: '工蜂地址', oauthClientId: 'OAuth Application ID',
  repository: '仓库', ref: '分支或 Tag', token: 'Private Token', tokenHint: '留空以保留已配置 Token', oauthLogin: '使用 OAuth 登录',
  oauthConnected: 'OAuth 授权成功，请选择仓库。', oauthExpired: 'OAuth 授权等待超时，请重试。', connectToken: '使用 Token 连接', save: '保存来源',
  confirmRemove: '确认从当前 Web profile 卸载该插件？', partialUpdate: '部分插件已更新；请检查失败信息后重试。', catalogCount: '目录总数', updateCount: '可更新', installedCount: '已安装',
} as const

export type LocaleKey = keyof typeof zh

export const en: Record<LocaleKey, string> = {
  tab: 'Plugin marketplace', source: 'Trusted source', connected: 'Connected', disconnected: 'Connection required', configure: 'Source settings', refresh: 'Refresh catalog',
  installed: 'Installed', available: 'Catalog', compatible: 'Compatible', updates: 'Updates', search: 'Search name, package, or description', all: 'All',
  install: 'Install', update: 'Update', updateAll: 'Update all', remove: 'Uninstall', removing: 'Uninstalling…', working: 'Working…',
  installedTag: 'Installed', incompatible: 'Incompatible with this DSH version', empty: 'No plugins match the current filters.', emptyInstalled: 'The current profile has no catalog plugins installed.',
  restartPending: 'Changes are saved to the profile; finish this batch and restart once to apply them.', restartNow: 'Restart now', restartSent: 'Native Host restart requested.',
  error: 'Operation failed', retry: 'Retry', sourceSummary: 'Single trusted repository · digest verification · install scripts disabled', baseUrl: 'Gongfeng URL', oauthClientId: 'OAuth application ID',
  repository: 'Repository', ref: 'Branch or tag', token: 'Private token', tokenHint: 'Leave blank to keep the configured token', oauthLogin: 'Sign in with OAuth',
  oauthConnected: 'OAuth authorized; select a repository.', oauthExpired: 'OAuth authorization timed out; try again.', connectToken: 'Connect with token', save: 'Save source',
  confirmRemove: 'Uninstall this plugin from the current Web profile?', partialUpdate: 'Some plugins were updated; review the failure and retry.', catalogCount: 'Catalog', updateCount: 'Updates', installedCount: 'Installed',
}
