# DSH Plugin Marketplace

`@shamcleren/dsh-plugin-marketplace` is an external bundle for the trusted single-source DeepSeek Harness Marketplace. Installing the bundle disables the Web profile's shipped Marketplace Host and client rows, mounts the extracted Host service through this package, and registers a replacement management UI.

## Install

```sh
dsh plugin --profile web add /absolute/path/to/dsh-plugin-marketplace
dsh web
```

The target profile must provide DeepSeek Harness `0.1.0-rc.8` APIs. The package pins its peer API range and Typert descriptors to that release; protocol or service changes require a tested package update instead of runtime fallbacks.

## Behavior

The Host accepts one configured Gongfeng repository and ref, validates the catalog, verifies artifact byte length and SHA-256, rejects packages outside the catalog, disables package installation scripts, serializes profile mutations, and restores the profile manifest and lockfile when a mutation fails.

The browser UI provides source status, OAuth or Private Token configuration, catalog refresh, search, compatibility and update filters, installed and update counts, per-plugin progress, guarded uninstall, batch updates with partial-failure reporting, and a single restart prompt after a batch of changes.

The bundle replaces these composition rows:

- `marketplace`
- `ui-marketplace`

It then inserts `marketplace-external`, whose default export is the trusted Marketplace service and whose `./client` export owns the replacement browser tab.

## Security

This package does not aggregate public registries and does not install arbitrary NPM or GitHub sources. Catalog credentials remain in the Harness credential service and are never returned to the browser. Installation scripts stay disabled. A catalog entry is not a general trust assertion: the configured repository owner remains responsible for reviewing every published artifact.

## Model Experience

The plugin adds no model-facing prompt sections or tools. It changes the Host composition through human-operated settings, and installed plugins own any later model-visible behavior.

## Known Limitations and Deferred Work

- The Host implementation is extracted from the `0.1.0-rc.8` trusted Marketplace package. Security fixes in the Harness implementation must be reviewed and ported into this plugin release.
- Only one trusted repository is active at a time. Public catalog aggregation belongs in a separate plugin such as `dshmarket`.
- Web Host changes require a restart. The UI batches mutations and requests one restart but does not hot-load arbitrary package code.

## Verification

`pnpm check` runs Host and browser type checks, 25 tests covering catalog validation, repository responses, OAuth state and refresh behavior, command bounds, cache integrity, view filters, and Typert ownership, then builds the Host and browser artifacts. A temporary Web profile smoke test must reach the printed loopback URL with the shipped Marketplace rows disabled and `marketplace-external` mounted.
