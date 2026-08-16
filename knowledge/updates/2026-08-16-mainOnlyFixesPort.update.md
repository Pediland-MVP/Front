# 2026-08-16 — Porting main-only fixes onto `merged-admin`

Reference code: `apps/dashboard/src/app/(Console)/settings/subscription/verify/page.tsx`.

Related: `Back/knowledge/updates/2026-08-16-masterOnlyFixesPort.update.md` (the paired
audit on the backend side).

## Problem

`merged-admin` is about to be promoted to `main`. It split from `main` on 2026-05-22 and
is 601 ahead / 9 behind. Promotion takes the branch's tree wholesale, so any fix that
exists only on `main` would silently disappear from production.

`main` had **8 non-merge commits** that `merged-admin` never received.

## Solution

Each was checked by reading both versions of the code. Three groups came out of it.

### Group 1 — already present (do nothing)

| main commit | Where it lives here |
|---|---|
| `b3c3c14c` add zibal | `AuthProvider`, verify page, `ErrorCodes.json` |
| `88bc9cdb` allowlist `dl.befroosh.app` for next/image | `apps/dashboard/next.config.mjs` |
| `a1ca69d3` raw server error code in IG callback toast | `apps/dashboard/src/hooks/useConnectInstagram.ts` |
| `aa12f78e` re-encode voice recordings as real WAV | `packages/ui/src/components/ui-custom/AudioRecorder.tsx` — `recordingToWavBlob` / `audioBufferToWavBlob` already here |

### Group 2 — deliberate divergence (must NOT be ported)

- `4674fced` then `4134fc4f` flip-flopped the auth `next` path:
  `data.data.next` → `data.data.result.next` → back to `data.data.next`.
  `main`'s final state matches **master's** backend, where `prelogin` returns the service
  result directly. `workspace-refactor` wraps it in `ResponseMessage` with
  `data: { result }`, so the correct client path against the new backend is
  `data.data.result.next` — which is what `merged-admin` already has.
  **Porting main's final flip would break login.** Verified by reading
  `Back apps/core/src/auth/auth.controller.ts` on both branches.

### Group 3 — real gap, ported (1 commit)

- `3e9956f2` prevent duplicate verify-payment request.

### Deliberately skipped

- `902aaebf` "correct front build context after Sources move under manual-deploy" changes
  `context: /home/cicd/Front` → `/home/cicd/manual-deploy/Sources/Front` in four
  `docker-compose-Front*.yml` files. The old path is certainly dead, but on `main` those
  files sit at the repo root next to a root `Dockerfile`; here they were moved under
  `apps/dashboard/` and the repo root has `Dockerfile.dashboard` / `Dockerfile.admin`
  instead. Neither main's path nor the current one is correct for the monorepo layout, so
  copying the value would produce a config that still cannot build. Left for the deploy
  rework (see the `fix/dockerfile-monorepo-prune` branch) rather than guessed at.

## Changes

`fix(subscription): send the payment verify request exactly once`

`main` fixed a duplicate verify caused by `useSWRImmutable`. This branch had already
rewritten the page to call `api.get` inside an effect, but never carried the guard over,
so the duplicate stayed reachable by a different route: the effect depends on
`searchParams`, whose object identity can change between renders, and React StrictMode
invokes effects twice in dev. Either path fires a second verify for the same payment.

A `useRef` latch is set after the gateway-detection check, so the "not a real gateway
callback" branch is unaffected and a genuine callback verifies once.

## Verification

`pnpm exec tsc --noEmit` in `apps/dashboard` — **188 errors before and after, identical
set**. All 188 pre-date this work; none are in the verify page. (The app builds with
`ignoreBuildErrors`, so this baseline is expected.)
