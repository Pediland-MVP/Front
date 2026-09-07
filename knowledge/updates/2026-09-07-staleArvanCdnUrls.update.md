# 2026-09-07 — Stale ArvanCloud CDN URLs → Cloudflare R2

Related: `knowledge/updates/2026-08-05-r2ImageHosts.update.md` (next/image host allowlist for R2).

## Problem

Prod core moved its object storage from ArvanCloud to Cloudflare R2 on 2026-07-23, and the two
Arvan buckets (`befroosh` and `testz`) were later **deleted**. The dashboard still had 10
hardcoded `*.arvanstorage.ir` media URLs in component code, all returning **404** in production
(an 11th `arvanstorage.ir` mention, the `next.config.mjs` allowlist entry, is intentionally kept —
see below):

| Ref | Old bucket | State |
|---|---|---|
| "How to connect Instagram" help video (×2 call sites) | `befroosh` | Object had been copied to R2 — only the host was stale |
| 8 automation-wizard hint videos (7 distinct files) | `testz` | Never copied to R2 — genuinely gone |

User impact: every `HelpMeDialog` on the Connect page, the Instagram-reconnect dialog, and all
automation-wizard hint buttons opened a video player that could never load.

## Solution

**1. Help video — host swap only.** The object already existed at the same key on the prod R2
bucket, so this was a pure URL rewrite. Also dropped the trailing `?versionId=` (an empty
ArvanCloud versioning artifact that R2 has no use for).

```text
https://befroosh.s3.ir-thr-at1.arvanstorage.ir/learn%2F<key>-720p.mp4?versionId=   (404)
https://dl.befroosh.app/learn/<key>-720p.mp4                                      (200)
```

**2. Hint videos — re-uploaded to R2.** The source files were recovered from the author's local
`~/Videos/Befroosh/Hints/compressed/`. They were remuxed from QuickTime `.MOV` to `.mp4`
(`ffmpeg -c copy -movflags +faststart` — no re-encode, so no quality loss) and uploaded to the
prod `befroosh` R2 bucket under the `site/hints/` prefix, which was previously empty.

Two reasons for the container change: `.mp4` is reliably playable in every browser where `.MOV`
is not (Firefox in particular), and `+faststart` moves the moov atom to the front of the file so
the video starts playing before it has fully downloaded.

Uploaded with `Content-Type: video/mp4` and `Cache-Control: public, max-age=31536000, immutable`.
The filenames are content-stable, so an immutable long cache is safe; **replacing a hint video
later requires a new filename**, not an overwrite.

## Changes

| File | Change |
|---|---|
| `apps/dashboard/src/app/(Connect)/connect/page.tsx` | `HelpMeDialog videoSrc` → `dl.befroosh.app` |
| `apps/dashboard/src/components/Settings/InstagramReconnectDialog.tsx` | `HelpMeDialog videoSrc` → `dl.befroosh.app` |
| `apps/dashboard/src/components/Automations/wizardVideoLinks.conf.ts` | All 8 `Hints.*.video` entries → `dl.befroosh.app/site/hints/*.mp4` |

`apps/dashboard/next.config.mjs` was **deliberately left alone**. Its
`befroosh.s3.ir-thr-at1.arvanstorage.ir` `images.remotePatterns` entry is not for component code —
it covers pre-R2 `file.url` rows still stored in the database. That entry should only be removed
once those rows are rewritten (a Back/DB task, unrelated to this change).

The `befroosh.storage.iran.liara.space` URLs in `wizardVideoLinks.conf.ts` and
`Console/startKit.tsx` are a different provider, are still live (verified 200), and were untouched.

## Verification

- All 7 uploaded objects return **HTTP 206** on ranged requests via `https://dl.befroosh.app/site/hints/*.mp4`
  with `Content-Type: video/mp4` — range support confirms in-player seeking works.
- The help video returns **200** at its new `dl.befroosh.app` URL.
- Old Arvan URLs confirmed **404** on both buckets before the change.
- `grep -rn arvanstorage apps/` now matches only the intentional `next.config.mjs` allowlist line.
- All three changed files parse clean under the TypeScript parser. Full `tsc --noEmit` was **not**
  run: this worktree has no `node_modules`, and the edits are string-literal-only with no type
  surface.
