# DSH Plugin Marketplace

`@shamcleren/dsh-plugin-marketplace` is an external bundle for a trusted single-source DeepSeek Harness Marketplace. It adds its own Host service and browser tab using upstream profile and UI extension points. It does not modify the DSH checkout or require private Marketplace packages in the Host.

## Install

```sh
dsh plugin --profile web add /absolute/path/to/dsh-plugin-marketplace
dsh web
```

The tested runtime is the official DeepSeek Harness `0.1.0-rc.8` npm distribution. Newer upstream releases require compatibility testing before updating this pin. Catalog compatibility uses the installed DSH version, not this plugin's version.

## Behavior

The Host accepts one configured Gongfeng repository and ref, validates the catalog, verifies artifact byte length and SHA-256, rejects packages outside the catalog, disables package installation scripts, serializes profile mutations, and restores the profile manifest and lockfile when a mutation fails.

The browser UI provides source status, OAuth or Private Token configuration, catalog refresh, search, compatibility and update filters, installed and update counts, per-plugin progress, guarded uninstall, batch updates with partial-failure reporting, and a single restart prompt after a batch of changes.

The bundle inserts `trusted-marketplace`. Its `./client` export uses `settings.plugins.tab` and a loopback-only `/trusted-marketplace` RPC with validated, allowlisted operations. No private `remote.marketplace` or generated Typert descriptor is required. Configuration is stored under `trusted-marketplace`; configure the trusted source again when migrating from a private Host build. Public catalogs such as `dshmarket` remain independent plugins.

## Security

This package does not aggregate public registries and does not install arbitrary NPM or GitHub sources. Catalog credentials remain in the Harness credential service and are never returned to the browser. Installation scripts stay disabled. A catalog entry is not a general trust assertion: the configured repository owner remains responsible for reviewing every published artifact.

## Model Experience

The plugin adds no model-facing prompt sections or tools. It changes the Host composition through human-operated settings, and installed plugins own any later model-visible behavior.

## Known Limitations and Deferred Work

- This repository owns the trusted-source implementation and its security updates; it is not an upstream built-in Marketplace package.
- Only one trusted repository is active at a time. Public catalog aggregation belongs in a separate plugin such as `dshmarket`.
- Web Host changes require a restart. The UI batches mutations and requests one restart but does not hot-load arbitrary package code.

## Verification

`pnpm check` runs Host and browser type checks, tests for catalog validation, repository responses, OAuth state and refresh behavior, command bounds, cache integrity, view filters, and RPC validation, then builds both artifacts. Integration verification installs the tarball into an isolated official Web profile and checks that the settings tab reads its installed package list. Live Gongfeng authorization and private artifact installation require an authorized account.
