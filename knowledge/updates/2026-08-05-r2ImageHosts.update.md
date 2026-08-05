# Allow the R2 media hosts in `next/image` (2026-08-05)

Front half of the R2 public-URL fix. Back half: `Back/knowledge/updates/2026-08-05-r2PublicUrl.update.md`
(merged via Back PR #5) and `.../2026-08-05-r2FollowUps.update.md`.

## Problem

The dashboard crashed on the workspace drawer:

```
Invalid src prop (https://test.63c6…r2.cloudflarestorage.com/…/<uuid>.html) on `next/image`,
hostname "test.63c6…r2.cloudflarestorage.com" is not configured under images
```

`WorkspaceDrawerContent.tsx:179` renders `instagram.profilePicture.url` straight from the
API. Every uploaded-media field (`file.url`, `file.tubmnailUrl`, template/guide images,
automation content images) is a **fully-qualified absolute URL built by the backend**, so
`next/image` refuses any host missing from `images.remotePatterns`.

## Solution

`apps/dashboard/next.config.mjs` — added the two R2 custom domains:

```js
{ protocol: 'https', hostname: 'dl.befroosh.app' },     // prod bucket
{ protocol: 'https', hostname: 'dltest.befroosh.app' }, // test bucket
```

**`**.r2.cloudflarestorage.com` is deliberately NOT listed.** That is R2's S3 API host and it
requires a SigV4-signed request — an unsigned GET returns `400 InvalidArgument`. Allowlisting
it would not have fixed anything; `next/image`'s own fetch would still fail. The actual fix
had to happen in the backend's URL builder, which is what the Back PR did.

`apps/admin` needs nothing — it has no `images` config and its only `next/image` use is a
local static logo import.

Also added `ERROR_CODES.UPLOAD_SOURCE_IS_NOT_AN_IMAGE` to `fa.json`, for the new backend
guard that rejects a non-image response from an Instagram CDN URL.

## ⚠️ Deploy coupling

Ship this **before or together with** the Back change, never after. Once Back is deployed it
writes uploads to `dl.`/`dltest.befroosh.app`, and a dashboard whose `remotePatterns` do not
list them rejects every one.

Note `next.config.mjs` is read at **build** time, so this needs a dashboard rebuild, not just
a restart.

## Changes

- `apps/dashboard/next.config.mjs` — two hostnames + a comment on why the S3 API host is excluded.
- `apps/dashboard/src/messages/fa.json` — `ERROR_CODES.UPLOAD_SOURCE_IS_NOT_AN_IMAGE`.
- Cross-repo reference: `knowledge/front-back-relations.doc.md` (outer repo) gained a
  "Uploaded media URLs" section describing this Front/Back contract.

## Verification

- `curl` against the live buckets: the S3 API host returns `400 InvalidArgument`; the same key
  via `https://dltest.befroosh.app/<key>` returns `200 image/jpeg`.
- `prettier --check` clean.
- No build or browser verification yet.
