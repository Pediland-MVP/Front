# `AUDIO_TOO_LONG` error-code translation (2026-08-27)

Paired backend: `Back/knowledge/updates/2026-08-27-audioConverterTimeoutBackport.update.md`.
Contract: `Back/knowledge/front-back-relations.md` → "Automation audio upload — error codes".

## Problem

The Back audio converter gained a new error code. `POST /contentCycle/upload` now runs an
**ffprobe length check** and rejects audio over the 10-minute cap with `AUDIO_TOO_LONG` (400),
instead of ffmpeg's `-t` cap silently storing only the first 10 minutes and returning `200 OK`.

The dashboard renders upload failures through `t_ec` (`useTranslations("ERROR_CODES")`), which
falls back to the backend's raw English `message` when a key is missing. `ErrorCodes.json` already
had `INVALID_AUDIO_FILE`, `AUDIO_CONVERSION_FAILED` and `AUDIO_CONVERTER_BUSY` but not this one,
so an over-long upload would have shown "Audio is longer than the 10-minute limit" in English
inside an otherwise Persian UI (CLAUDE.md §10 requires a key per backend error code).

## Solution

One key in the dashboard's Persian error-code messages, placed beside the other three audio codes.

## Changes

| File | Change |
| --- | --- |
| `apps/dashboard/src/messages/fa/ErrorCodes.json` | `"AUDIO_TOO_LONG": "مدت فایل صوتی بیشتر از ۱۰ دقیقه است. لطفاً فایل کوتاه‌تری بفرستید."` |

`messages/fa/ErrorCodes.json` is the file that actually loads at runtime — the `ERROR_CODES` block
inside `messages/fa.json` is fully shadowed by the shallow spread in `i18n/request.ts` and is dead.
Per CLAUDE.md §8, `en/ErrorCodes.json` is left alone (it carries none of the other audio codes
either); English is translated later.

## Verification

- `JSON.parse` on the edited file succeeds (valid JSON, no trailing-comma break).
- Key sits inside the same `ERROR_CODES` object as the three existing audio codes, so `t_ec` finds
  it by the exact code string the backend sends.
