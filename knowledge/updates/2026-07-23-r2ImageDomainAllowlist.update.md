# 2026-07-23 — Allowlist Cloudflare R2's `dl.befroosh.app` for Next.js image optimization

Reference: `next.config.mjs` (`images.remotePatterns`).

## Problem

Backend (`Back` repo) migrated file storage from ArvanCloud to Cloudflare R2
(`Back/knowledge/updates/2026-07-23-uploadServiceR2Migration.update.md`), deployed to prod on
`ssh back` 2026-07-23. New uploads now return URLs on `https://dl.befroosh.app/...` instead of
`https://befroosh.s3.ir-thr-at1.arvanstorage.ir/...`.

The raw URL works fine (confirmed `HTTP 200` directly), but the dashboard renders images through
Next.js's `next/image` component, which proxies through `/_next/image?url=...` and requires the
source hostname to be explicitly allowlisted in `images.remotePatterns` — otherwise it returns
`400`. `dl.befroosh.app` was never added when the backend switched providers, so **every image
uploaded since the R2 cutover was invisible in the actual UI** (confirmed live: an automation
media upload's raw URL returned `200`, the same URL through `/_next/image` returned `400`).

## Solution

Added `{ protocol: "https", hostname: "dl.befroosh.app" }` to `images.remotePatterns` in
`next.config.mjs`, alongside the existing (now-legacy but still needed for old rows)
`befroosh.s3.ir-thr-at1.arvanstorage.ir` entry.

## Changes

- `next.config.mjs` — added `dl.befroosh.app` to `images.remotePatterns`.

## Scope note

This repo is on `main` (pre-Turborepo-monorepo-migration layout — repo root, not
`apps/dashboard/`), which is what's actually deployed to prod (`ssh back`, `front1`/`front2`).
The `merged-admin` branch (post-monorepo-migration, `apps/dashboard/next.config.mjs`) has the
**same** stale allowlist (missing `dl.befroosh.app` there too) and needs the identical fix
whenever that branch is next deployed or merged — not done here since it's not live yet.

## Verification

- Live, direct: `curl https://dl.befroosh.app/befroosh/befroosh/.../....jpeg` → `200`.
- Live, via prod `/_next/image` proxy (pre-fix): `400`.
- Not yet re-verified against a deployed build with this fix — pending deploy.
