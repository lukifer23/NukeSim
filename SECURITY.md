# Security policy

## Scope

NukeSim is a static, client-side web app. It has no backend, no accounts, no network calls at runtime, and stores only a scenario draft and local lesson progress in the browser's `localStorage`. The relevant attack surface is limited to rendering untrusted input from shared scenario links and stored data.

Shared links and stored data are parsed defensively: values are validated against allowlists (`src/sim/scenario.ts`, `src/state/draft.ts`), clamped to the model envelope, and rejected when malformed.

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please report privately using GitHub's [Report a vulnerability](https://github.com/lukifer23/NukeSim/security/advisories/new) advisory form rather than a public issue. Include steps to reproduce and the impact. We aim to acknowledge reports within a few days.

Please do not include personal data, and do not perform denial-of-service or resource-exhaustion testing against the public demo.
