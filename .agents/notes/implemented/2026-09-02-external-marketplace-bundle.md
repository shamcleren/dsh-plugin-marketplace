# External Marketplace bundle

## Decision

The trusted single-source Marketplace ships as an external profile bundle. Its bundle patch disables the shipped `marketplace` and `ui-marketplace` rows and inserts one package that owns the extracted Host service, Typert descriptors, and browser client.

## Rationale

Marketplace release cadence and interaction design can evolve without changing the Harness repository. The package carries credential, artifact verification, transaction, and rollback code so it remains installable even though the original Host package is not published independently.

The browser uses the generic `settings.plugins.tab` slot and the public `remote.marketplace` methods. UI state is derived from the Host catalog and installed dependency list; mutation success triggers a fresh read instead of optimistic installed state.

## Alternatives considered

Depending on the original Host package would avoid duplication but cannot produce an installable external bundle because that package is not published. Building on the public `dshmarket` registry would replace the single-source trust model with a different product rather than externalizing it.

## Verification

The tests pin catalog validation, repository responses, OAuth state and refresh behavior, command bounds, cache integrity, catalog/install joins, compatibility-aware update detection, search normalization, combined filters, and Typert ownership. TypeScript checks cover Host and browser entry points, the production build emits the Host module plus browser loader bundle, and a temporary Web profile reaches its loopback URL with the replacement rows composed.
