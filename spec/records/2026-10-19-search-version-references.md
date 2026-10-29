# Search saved-version references

LN-SRCH-051's result contract now carries an optional immutable content identity
and explicit checkpoint references. Search can group reintroduced identical
contents without losing exact checkpoint navigation. These are additive
presentation types; registry lifecycle and source authority are unchanged.

`pnpm --filter @lapis-notes/api check:types` and
`pnpm --filter @lapis-notes/api build` pass, including publint and packed contract
checks. The public npm archive is generated through pnpm with lifecycle scripts
disabled only after the successful build. `--ignore-scripts` was rejected by pnpm
pack; `--config.ignore-scripts=true` is the supported configuration.

The enclosing source revision owns this slice. Consumer Search/Desktop
integration and M14.6 native acceptance remain separate; no package publication
or wider release qualification is claimed.
