# Changelog

All notable changes to NukeSim are documented here. This project follows [Semantic Versioning](https://semver.org/) and the format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.3.0] - 2026-09-19

### Added
- Guided Academy with four five-minute missions that predict first, then verify against captured runs, with local model-versioned progress.
- Honest effects library (`src/sim`): blast cube-root scaling with a Mach-reflection HOB knee, thermal pulse, prompt radiation, Miller SFSS fallout, crater, and mushroom cloud — each tagged with a confidence level and its exclusions in the in-app model card.
- Five deterministic fictional cities and a walkable 3D field with field/ground-zero/cloud cameras.
- Setup bench with quick scenarios, comparison baseline, scheme sharing, and a debrief with a copyable summary.
- Probe tool for point readings (overpressure, thermal, prompt dose, fallout, line of sight).
- Browser-synthesized blast audio timed to shock arrival; keyboard shortcuts panel; reduced-motion support.
- GitHub Pages deployment and continuous integration (lint, coverage, build, budgets, Playwright).

### Changed
- Renderer quality adapts before a run and locks for that run so comparisons stay visually consistent.
- The last scenario setup, visible overlays, and camera view are restored on reload while the safety disclaimer still gates a run.

### Security
- Runtime dependencies audit clean; shared-link and stored-data parsing is allow-listed and clamped.

[Unreleased]: https://github.com/lukifer23/NukeSim/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/lukifer23/NukeSim/releases/tag/v0.3.0
