# Instagram Post Button Type (2026-07-17)

See design: `docs/superpowers/specs/2026-07-17-instagram-post-button-design.md`.

## Problem
Button templates only let a user link a URL button by typing/pasting a link by hand. There was no quick way to point a button at one of the workspace's own Instagram posts, even though the automation builder already has a "select post" flow (`InstagramPostSelectDialog`, used by "پست خاص") for exactly that kind of picking.

## Solution
Added a new "پست اینستاگرام" (Instagram Post) button type to the button-template editor. Selecting it reuses `InstagramPostSelectDialog` (generalized to a headless/controlled mode) to pick a post; the post's `permalink` fills the button's URL. Under the hood the button is saved as an ordinary URL button (`postbackPayloadType: 'url'`) — no backend changes. Enforces the same single-Instagram-account guard and toast as "پست خاص". Excluded from template builder mode (no fixed Instagram account there).

## Changes
- `packages/ui/src/automation-builder/types/buttons.enum.ts`: new `INSTAGRAM_POST` value (UI-only — never written to `postbackPayloadType`).
- `packages/ui/src/automation-builder/Form/InstagramPostSelectDialog.tsx`: new optional `open`/`onOpenChange`/`onSelect` props for headless/controlled reuse outside its original "پست خاص" thumbnail-trigger usage; now also exposes each post's `permalink`.
- `packages/ui/src/automation-builder/Contents/ContentButtonsItem.tsx`: new button-type option, per-row local "displayed type" state (since the saved form value alone can't distinguish "Instagram Post" from plain "URL" once saved), guard check + dialog wiring.
- `apps/dashboard/src/messages/fa.json`, `apps/admin/src/messages/fa.json`: new `Automations.Contents.Button.instagram_post` translation keys.

## Verification
- Unit tests: `packages/ui/src/automation-builder/Form/__tests__/InstagramPostSelectDialog.test.tsx`, `packages/ui/src/automation-builder/Contents/__tests__/ContentButtonsItem.test.tsx`.
- Manual: dashboard automation builder (single-account happy path, reopen-shows-as-URL behavior, two-account guard toast) and admin template builder (option hidden).
