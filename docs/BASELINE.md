# Local implementation baseline

- Captured: 2026-08-24 (America/Chicago)
- Authority: this local directory, per user direction
- Included: source, tests, documentation, public assets, package manifests, and tool configuration
- Excluded: dependency, build, coverage, browser-report, test-result, and `.gstack` output directories
- Aggregate SHA-256: `8f7582375473c480dab62fa506c7e6f767c91a3780c0393e1819c189979bea41`

## Verified starting gates

- `npm run verify`: passed before implementation
- Unit tests: 62 passed
- Main bundle: 98.9 KiB gzip (105 KiB budget)
- Scene bundle: 337 KiB gzip (360 KiB budget)
- `npm run test:perf`: passed the headed Chrome 10 kt and 1 Mt frame-budget check

This record establishes the pre-redesign local snapshot. The Git root commit contains the recoverable file-level baseline.
