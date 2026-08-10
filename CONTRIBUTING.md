# Contributing to CompuClass

## Branch flow

```
personal branch (lindo_branch, kamo_branch, lutho_branch, thabo_branch, mila_branch)
        │  push/merge when ready to prove your work
        ▼
   test_branch  ──────────────►  CI: lint, tests, expo-doctor
        │                          EAS Build (Android, 'preview' profile)
        │  open a PR once CI is green
        ▼
      main  (protected — PR + passing CI required to merge)
        │  on merge
        ▼
  EAS Build (Android, 'production' profile) · Web deploy (Vercel)
```

- Work on your own branch as usual.
- Push to `test_branch` (or open a PR into it) to run the full CI check (lint, tests, `expo-doctor`) before you touch `main`.
- Open a PR from `test_branch` into `main`. The same CI check runs as a required status check — a red check blocks the merge.
- Merging into `main` automatically triggers an Android **EAS Build** on the `production` profile and deploys the Expo web build via **Vercel**.

### Platform / feature status

| What | Status |
|---|---|
| Android builds | Active — EAS free tier, keystore managed by Expo |
| iOS builds | **Not enabled** — requires a paid Apple Developer account ($99/yr). Available via the manual "Run workflow" inputs once that exists. |
| EAS Update (OTA) | **Disabled** — needs `eas update:configure` first (installs `expo-updates`, adds `runtimeVersion`). See the comment at the top of `.github/workflows/eas-update.yml`. |

> **Heads up:** the EAS free tier allows a limited number of builds per month.
> Every push to `test_branch` or `main` consumes one. If you're iterating rapidly,
> remove `test_branch` from the triggers in `.github/workflows/eas-build.yml` and
> use the manual "Run workflow" button instead.

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
