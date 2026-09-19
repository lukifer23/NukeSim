## Summary

<!-- What changed and why. Link any related issue. -->

## How this was verified

- [ ] `npm run lint`
- [ ] `npx tsc -b`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run verify` (required for UI or scene changes)

## Checklist

- [ ] Physics touched? `docs/MODEL.md`, `src/data/model.ts`, and the affected tests are updated in this PR.
- [ ] New panels/imports are `lazy` and gated, and `npm run check:bundle` passes.
- [ ] New visual assets are local and recorded in `docs/ASSET_PROVENANCE.md`.
- [ ] No personal or device data (paths, usernames, hardware names) added.
- [ ] Accessibility considered (labels, `aria-pressed`, focus, reduced motion).
