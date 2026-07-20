# 2026-07-20 — Re-encode voice recordings as real WAV before upload

Ports `merged-admin` commits `43be35c6` + `a09fa9a6` to `main`, so the recorder
works against `master`'s backend (which now runs the ported audio converter,
Back `4260248c` / BEF-132).

## Problem

Uploading a recorded voice note returned:

```json
{ "code": "INVALID_AUDIO_FILE", "statusCode": 400 }
```

`AudioRecorder.tsx` builds the upload blob from a `MediaRecorder` created with
**no** `mimeType` option (`recorder = new MediaRecorder(stream)`), so Chrome
actually encodes **WebM/Opus** — but the code hardcoded the blob and `File` as
`audio/wav`. The backend's `audioSniff.util.ts` deliberately ignores the
client-supplied mimetype and sniffs real magic bytes; WebM matches none of the
five allowed containers (RIFF/WAVE, ID3, MP3-or-ADTS frame sync, ISO-BMFF), so
every recording was rejected.

Separately, `stopRecording` only called `MediaRecorder.stop()` and never stopped
the underlying `getUserMedia` tracks, so the mic stayed live and Chrome kept
showing the tab's recording indicator after saving.

## Solution

Decode the recorded blob with Web Audio's `decodeAudioData` and re-encode it as
a genuine RIFF/WAVE 16-bit PCM file before calling `onRecordingComplete`. The
uploaded bytes then always match a container the backend accepts, whatever codec
the browser chose. Also mirror `resetRecording`'s cleanup in `stopRecording`.

## Changes

- `src/components/ui-custom/AudioRecorder.tsx`
  - Added `writeAsciiString`, `audioBufferToWavBlob` (44-byte RIFF header +
    interleaved 16-bit PCM), and `recordingToWavBlob` (decode → re-encode,
    `AudioContext` always closed in `finally`).
  - `recorder.onstop` is now `async`: builds the blob from `recorder.mimeType`
    (the real codec, not a wishful label), re-encodes to WAV, and passes the WAV
    to `onRecordingComplete` / the preview object URL.
  - On decode failure: `console.error` + `toast.error(t("encodeError"))`.
    Deliberately **not** `alert(error)` as on `merged-admin` — CLAUDE.md §8
    forbids hardcoded user-facing text, and a modal alert blocks the page.
  - `stopRecording` now stops the mic tracks, disconnects the analyser and
    closes the audio context, matching `resetRecording`.
- `src/messages/fa.json` — new `AudioRecorderWithVisualizer.encodeError` key.
  (Per CLAUDE.md §8 only `fa.json` is required; `en.json` has no such namespace.)
- Also on this branch (from the earlier Back port): the four audio `ERROR_CODES`
  translations and `audio/mpeg` in `MediaUploader`'s accept list.

## Only the logic was ported, not the formatting

`merged-admin` has been reformatted to the shared Prettier config (single
quotes, 100 cols); `main` has not. Copying the file wholesale would have dumped
a full-file reformat into the diff, so the two logical changes were applied by
hand in `main`'s existing style.

## Verification

- Backend accepts `audio/wav`: it is in `FORMATS.audio` in
  `maxFileSize.validator.ts`, and `RIFF....WAVE` is the first branch of
  `isAllowedAudioContainer`.
- **Not run**: typecheck / build / browser smoke test — pending.

## Known limit — WAV is uncompressed

PCM WAV at 48 kHz mono 16-bit is ~96 KB/s, so the backend's **25 MB** audio cap
is reached at roughly **4 minutes** of recording (~2 minutes if the browser
decodes to stereo). The converter's own cap is 10 minutes (`AUDIO_TOO_LONG`),
so the size limit now binds first for long recordings. Not a regression — no
recording uploaded successfully before this fix — but if long voice notes are
needed, either raise the audio size limit or re-encode to a compressed container
client-side instead of WAV.
