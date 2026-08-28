# 2026-08-28 — Voice recorder crashed on every iOS device (Sentry MY-2B)

Fixes Sentry issue [`MY-2B`](https://befroosh.sentry.io/issues/123043890/) —
`TypeError: undefined is not an object (evaluating 't.onstop=...')`, 276 events,
10 users, first seen 2026-05-27, still firing on 2026-08-28.

## Problem

Tapping **تایید** (save) in the voice recorder on `/automations/:id` crashed the page.
The minified frame maps to `AudioRecorder.tsx`'s `stopRecording`:

```js
recorder.onstop = async () => { ... }   // `recorder` was undefined
```

**100% of the 276 events were iOS** — 92× iOS 18.1.1, 55× 17.3.1, 25× 17.4.1, 11× 18.2.1,
3× 17.5 — across Mobile Safari, Chrome Mobile iOS and the Google app, which all run WebKit.
Not one event came from Android, desktop, or **any iOS ≥ 18.4**. That version boundary is
the tell.

Root cause is the mimeType picked in `startRecording`:

```js
const mimeType = MediaRecorder.isTypeSupported('audio/mpeg') ? 'audio/mpeg'
  : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
  : 'audio/wav';                                   // <- never checked for support
new MediaRecorder(stream, { mimeType });           // <- throws NotSupportedError
```

WebKit **before 18.4** supports only `audio/mp4` for `MediaRecorder`; it shipped WebM
recording in 18.4 (March 2025). So on those iOS versions both `isTypeSupported` probes
returned false, the chain fell through to the **unchecked literal `'audio/wav'`**, and the
constructor threw `NotSupportedError` — per spec, an unsupported `mimeType` throws.

That throw alone was survivable. It became a crash because of the ordering around it:

1. `setIsRecording(true)` ran **before** the throwing constructor, so the UI had already
   flipped into recording state and rendered the Save button.
2. The `.catch` only did `alert(error)` — it never reset `isRecording`, so the phantom
   recording UI stayed on screen.
3. `recorder` (module-level) was therefore never assigned, and `stopRecording`
   dereferenced it with no guard.

Two things hid this from review:

- **The type lied.** `let recorder: MediaRecorder` (not `| null`) told TypeScript the
  value was always present, so `recorder.onstop` type-checked cleanly.
- **The recorder that threw captured nothing.** It had no `ondataavailable` handler at
  all; every byte came from a *second*, default-constructed `recorder`, and the waveform
  came from the `analyser`. It duplicated the mic capture for no purpose and was the sole
  source of the crash.

## Solution

Drop the redundant recorder and construct the real one with **no `mimeType` option** —
every browser supports its own default container, and `recordingToWavBlob` already
re-encodes whatever codec the browser chose into a real WAV before upload
(see `2026-07-20-audioRecorderWavReencode.update.md`), so the explicit label bought
nothing and only introduced a way to throw.

Then close the two gaps that turned a caught error into a crash: enter the recording
state only once a recorder actually exists, and guard the dereference anyway.

## Changes

- `packages/ui/src/components/ui-custom/AudioRecorder.tsx`
  - `recorder` retyped `MediaRecorder | null = null`, so TypeScript now enforces the guard
    that was missing.
  - Removed `mediaRecorderRef.current.mediaRecorder` — the duplicate, data-less recorder
    whose `new MediaRecorder(stream, { mimeType })` was the throw site — and with it the
    whole `audio/mpeg → audio/webm → audio/wav` chain. The ref keeps only
    `stream` / `analyser` / `audioContext`, which the visualizer and cleanup use.
  - `setIsRecording(true)` moved **after** the recorder is constructed and started, and
    `ondataavailable` is now attached **before** `start()`.
  - `stopRecording` bails out and resets when `recorder` is null or already `inactive`,
    instead of assigning `onstop` on it.
  - New `releaseStream()` helper — the stream/analyser/context teardown was duplicated in
    `stopRecording` and `resetRecording` and missing from the error path; the `.catch` now
    calls it, so a failed start no longer leaks a live microphone.
  - `resetRecording` now stops the **real** `recorder`. It previously stopped only the
    data-less one, leaving the actual capture recorder running after "ضبط مجدد".
  - Removed the `currentRecord` state and its `RecordState` type. Nothing ever rendered it,
    so `window.URL.createObjectURL(wavBlob)` was minting a blob URL per recording that was
    never displayed and never revoked — dead state that leaked.
  - Replaced both `alert(error)` calls, which showed raw English `DOMException` text to
    Persian users, and `alert('recorder instance is null!')` — a leftover debug string —
    with `toast.error(t(...))`. Per CLAUDE.md §8 no user-facing string is hardcoded.
- `apps/dashboard/src/messages/fa.json` — new `AudioRecorderWithVisualizer.micError` and
  `.encodeError`. Per §8 only `fa.json` is required.
- `packages/ui/src/components/ui-custom/__tests__/AudioRecorder.test.tsx` — new.

## Verification

- New tests fake WebKit-before-18.4 (`isTypeSupported` true only for `audio/mp4`, and a
  constructor that throws `NotSupportedError` otherwise, as browsers do). Against the
  **old** code 3 of 4 fail, reproducing the production error verbatim —
  `TypeError: Cannot set properties of undefined (setting 'onstop')` at
  `AudioRecorder.tsx:182` via `handleSubmit` — while the Chromium case passes, matching
  prod exactly, where Chrome users never crashed. All 4 pass after the fix.
- Full `packages/ui` suite: **171 tests / 17 files pass**.
- `apps/dashboard` `tsc --noEmit`: **188 errors before, 188 after** — identical
  pre-existing set (see `2026-08-16-mainOnlyFixesPort.update.md`), none in this component.

## Not done — needs a real device

No iOS hardware or WebKit browser was available here (Playwright's WebKit could not launch
on this host: missing `libicu74`/`libxml2`/`libflite1`). The WebKit behaviour is established
from the spec, WebKit's own release notes and the Sentry version distribution, and encoded
in the tests — but **the fix has not been exercised on a physical iPhone**. Worth one manual
smoke test on iOS < 18.4 before this is considered closed, checking that a recording both
saves and uploads (the upload path re-encodes to WAV and is unchanged).

## Follow-up — the crash is fixed, the ceiling is not

`recorder`, `recordingChunks` and `timerTimeout` are **module-level**, so two
`AudioRecorderWithVisualizer` instances on one page would share them and fight. Only one is
rendered today (`MediaUploader.tsx`), so this is latent, not live — but it is why the tests
have to `vi.resetModules()` between cases. Moving that state into the component is the
durable fix.
