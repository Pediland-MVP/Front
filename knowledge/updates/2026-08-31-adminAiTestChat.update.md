# 2026-08-31 — Admin AI test chat page

Reference: `Back/knowledge/updates/2026-08-31-adminAiTestChat.update.md`, `Back/knowledge/front-back-relations.md` (Admin AI test chat section)

## Problem

Admins had no way to test the `telegramAutomation` AI (the assistant that auto-replies to the
admin's Telegram DMs) except by messaging the real Telegram bot account.

## Solution

New page `telegram-automation/test-chat`, added under the existing "اتوماسیون تلگرام" sidebar
group next to Docs/QA/Guides/Chats. Simple single-conversation chat UI (bubble styling copied from
`telegram-automation/chats/page.tsx`): a text box posts the whole running conversation to the new
Back endpoint `POST /telegram-automation/test-chat` and appends the returned reply. Fully
client-side/ephemeral — conversation lives only in React state, "شروع دوباره" clears it, and a page
refresh loses it by design (matches the ephemeral, no-DB-write backend). When the AI calls its
`send_guide`/`request_human_agent` tools in test mode, the backend returns a `notes[]` array
instead of really doing anything; the page renders each note as a small italic 🔔 line under the
assistant bubble.

## Changes

- `apps/admin/src/app/(main)/telegram-automation/test-chat/page.tsx` — new page.
- `apps/admin/src/components/app-sidebar.tsx` — added the nav entry.
- `apps/admin/src/components/app-breadcrumb.tsx` — added the `test-chat` segment label.
- `apps/admin/src/messages/fa.json` — added `Sidebar.testChat` and
  `ERROR_CODES.AI_TEST_CHAT_GENERATION_FAILED`.

## Verification

`pnpm --filter admin exec tsc --noEmit`: zero new errors in any touched file (all reported errors
are pre-existing app-wide baseline — missing `@radix-ui/*`/other deps, `packages/ui` type drift;
see `project_admin_frontend_tsc` memory). No test suite exists for this module's other pages
either, so none was added here beyond type-checking. **Not yet run in a browser** — recommend
starting the admin dev server and sending a real message through the page (with an active
`AdminAiProvider` configured) before considering this verified end-to-end.
