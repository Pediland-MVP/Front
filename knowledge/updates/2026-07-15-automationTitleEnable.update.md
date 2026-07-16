# Automation Title + Enable Switch (2026-07-15)

See design: `docs/superpowers/specs/2026-07-15-automation-title-enable-design.md`.

## Problem
No way to name an automation for easier identification in the list, or to temporarily disable one.

## Solution
Added an optional title field and an "فعال" (enabled) switch to the automation form, both sent as part of the existing create/update payload. The automation card shows the title (if set) and dims with a "غیرفعال" badge when disabled. List search matches title in addition to condition text (backend-only change — no frontend query change needed).

## Changes
- `src/schemas/automation.ts`, `src/schemas/automationForm.ts`: new `title`/`enabled` fields.
- `src/components/Automations/Form/TitleAndEnabled.tsx`: new form section (title input + enabled switch).
- `src/components/Automations/AutomationForm.tsx`: wires in the new section, defaults `enabled: true`.
- `src/components/Automations/AutomationCard.tsx`: renders title + disabled badge/dim style.
- `src/messages/fa.json`: new `Automations.TitleAndEnabled` namespace, `Automations.Card.disabled_badge` key.

## Verification
- Manual: created/edited an automation with a title and toggled enabled off/on in the dev server; confirmed card rendering and list search by title.
