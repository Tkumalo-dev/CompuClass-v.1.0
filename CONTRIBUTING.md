# Contributing to CompuClass

## Branch flow

```
personal branch (lindo_branch, kamo_branch, lutho_branch, thabo_branch, mila_branch)
        │  push/merge when ready to prove your work
        ▼
   test_branch  ──────────────►  CI runs: lint, unit/component tests, expo-doctor
        │  open a PR once CI is green
        ▼
      main  (protected — PR + passing CI required to merge)
        │  on merge
        ▼
  EAS Build (Android + iOS) · EAS Update (OTA) · Web deploy (Vercel)
```

- Work on your own branch as usual.
- Push to `test_branch` (or open a PR into it) to run the full CI check (lint, tests, `expo-doctor`) before you touch `main`.
- Open a PR from `test_branch` into `main`. The same CI check runs as a required status check — a red check blocks the merge.
- Merging into `main` automatically:
  - triggers cloud builds for Android and iOS via **EAS Build**
  - publishes an OTA JS update via **EAS Update** for testers already on an installed build
  - exports and deploys the Expo web build via **Vercel**

## Running checks locally

From `CompuClass-v.1.0-main/`:

```bash
npm ci
npm run lint       # ESLint
npm test           # Jest (watch mode)
npm run test:ci    # Jest with coverage, CI mode
npx expo-doctor    # project/dependency health check
```

## Tests

Tests live next to what they cover, in `__tests__/` folders:
- `services/__tests__/` — unit tests for business logic (auth, AI, offline sync), with Supabase/`fetch` mocked.
- `components/__tests__/`, `screens/__tests__/` — component tests using React Native Testing Library.

Add tests alongside new services/components/screens using the same pattern. CI fails the build if `npm run test:ci` fails, so broken tests block merges to `main` just like lint errors do.
