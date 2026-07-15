# Template System — Frontend — 2026-07-14

Full reference: `Back/knowledge/core/templates/` and `Back/knowledge/admin/templates/` (backend
`isTemplate` flag on `ContentCycle`, `/templates` endpoints on both `core` and `admin`).

## Problem

Building an automation from scratch is slow. There was no way for an admin to author a
reusable "starter" automation (a template) that a user could pick from, and no way for a
user to insert an existing template's message steps into an automation they're already
editing.

## Solution

- **Shared builder extraction.** The dashboard's `AutomationForm` internals (Conditions/
  Triggers/Contents/JustFollowers/CommentTrigger sections, the Zod schema, enums, and every
  content-type editor) moved out of `apps/dashboard` into `packages/ui/src/automation-builder`
  as a single `AutomationBuilder` component, so both the dashboard (real automations) and
  the new admin templates UI (template authoring) render from **one** implementation
  instead of two copies drifting apart.
  - `AutomationBuilder` takes a `mode: 'automation' | 'template'` prop.
    `mode="automation"` renders the full flow (JustFollowers, comment-trigger inputs,
    comment-limit alert) in addition to Conditions/Triggers/Contents; `mode="template"`
    renders only Conditions/Triggers/Contents — templates have no workspace/live-automation
    context for follow-gating or comment consent.
  - The caller supplies an `apiClient: { upload, get }` (`AutomationBuilderApiClient`) so the
    shared Contents-tree pickers (media upload, Instagram post picker, product picker,
    automation search-select) stay app-agnostic — the dashboard's copy is
    `apps/dashboard/src/lib/automationApiClient.ts` (`dashboardAutomationApiClient`), the
    admin's is `apps/admin/src/lib/templateAutomationApiClient.ts`
    (`templateAutomationApiClient`).
  - Everything else the caller needs is a prop: `initialValue`, `onSubmit`/`beforeSubmit`/
    `onInvalid`, `submitLabel`/`cancelLabel`, `headerSlot` (rendered above
    Conditions/Triggers, inside the form's `FormProvider` — the dashboard uses it for
    `InstagramSelectField`, the admin template form uses it for
    title/description/applies-to-all-categories/thumbnail), `helpSlots` (per-section help
    dialogs), `hasInstagram`/`isPromotion`/`commentRepliesSlot` (automation-only, ignored in
    template mode).
  - `apps/dashboard/src/components/Automations/AutomationForm.tsx` is now a thin wrapper:
    it fetches/transforms the automation (or template — see below) via SWR, wires up
    dashboard-only cross-field checks (`beforeSubmit`, free-quota warning dialog) and posts
    to `/contentCycle`, then hands everything to `AutomationBuilder mode="automation"`.

- **Admin templates CRUD (`/templates`).**
  `apps/admin/src/app/(main)/templates/` mirrors the existing `workspace-categories` admin
  page pattern: `page.tsx` → `client-page.tsx` (paginated/searchable `/templates` SWR query)
  → `templates-table.tsx` + `columns.tsx` (thumbnail, title, description, categories/
  "applies to all" badge, row actions) for the list, and a separate `TemplateForm.tsx`
  (used by both `templates/add/page.tsx` and `templates/[id]/page.tsx`) that renders
  `AutomationBuilder mode="template"` with a `headerSlot` holding the template's own
  metadata form (title, description, "applies to all categories" switch + category
  multi-select sourced from `/workspace-categories`, thumbnail upload). Template metadata
  lives in a **separate** `react-hook-form` instance (`metaForm`) from the shared builder's
  own form, since the metadata fields aren't part of `AutomationFormSchema` — they're
  merged into one payload only at submit time. Because `AutomationFormSchema.instagramIds`
  requires at least one entry regardless of mode (moved into `packages/ui` unchanged), the
  admin form seeds a fixed placeholder UUID that the backend's whitelisted `CreateTemplateDto`/
  `UpdateTemplateDto` silently strips.
  Editing an existing template requires the backend's `GET /templates/:id` (returns the raw
  `ContentCycle` entity graph plus a derived `categoryIds: string[]`); the admin form
  normalizes that shape (button `postbackPayloadType`, vitrin image derivation, delay-unit
  derivation) the same way the dashboard's `AutomationForm` normalizes a real automation.

- **Shared `TemplatePicker` (`packages/ui/src/automation-builder/TemplatePicker/`).**
  A search + responsive grid (Dialog on desktop, Drawer on mobile) of template cards,
  reused in two dashboard flows:
  1. **Create Automation from template** — `CreateAutomationTemplateDialog.tsx`, opened
     from the automations list page (`apps/dashboard/src/app/(Console)/automations/page.tsx`),
     lists templates via `GET /templates?search=`, and on selection navigates to
     `/automations/add?templateId=<id>` (a "start from scratch" footer button navigates to
     plain `/automations/add`).
  2. **In-form "Template" content-type insert** — a `'template'` entry was added to the
     Contents-tree's content-type picker (`ContentTypeOptions.tsx`), last in the list. Picking
     it opens the same `TemplatePicker` inline (`Contents.tsx`); on select it fetches
     `GET /templates/:id` and appends **only** that template's `contents[]` (never its
     triggers/conditions) to the current form via `remapTemplateContents` — the append-only
     normalization function under `Contents/remapTemplateContents.ts` that strips
     server-only fields (`id`/timestamps/back-refs), re-derives `delayUnit`/vitrin
     `imageId`+`imageUrl`, normalizes button `postbackPayloadType`, and — importantly —
     **strips workspace-scoped references** (`products`/`productIds`/`contentProducts`,
     `instagramPost`/`mediaId`) since a template's product/media refs point at the
     template-author's workspace, not the destination automation's; a `PRODUCT` content
     item is left as an empty "pick products" placeholder instead of a dangling reference.
     This `'template'` option is hidden both in `mode="template"` (a template can't embed
     another template) and in reminder-mode Contents trees (a template's content graph,
     including a DELAY step, doesn't make sense inside a reminder sequence).

- **`?templateId=` prefill on `/automations/add`.** Extends the page's existing `copyFrom`
  precedent: `AutomationForm` accepts a `templateId` prop, and — only when there's no `id`
  and no `copyFromId` (a brand-new automation) — fetches `GET /templates/:id` via
  `useSWRImmutable`, feeding the same `source`/`initialValue` transform `copyFromId` uses.
  Unlike `copyFromId`, this path shows **no confirmation toast**: nothing is persisted until
  the user actually submits, so there's nothing to confirm "copied" yet. One fix needed here:
  `GET /contentCycle/:id` (the `copyFromId` source) always synthesizes a `reminders` array,
  but `GET /templates/:id` omits `reminders` entirely (templates don't have reminders) — the
  transform now falls back to `source.reminders?.map(transformContent) ?? []` so the field
  doesn't end up `undefined` and silently fail `AutomationFormSchema`'s non-optional
  `reminders: z.array(...)` check on submit.

## Changes

- `packages/ui/src/automation-builder/` (new module) — `AutomationBuilder.tsx`/
  `.types.ts`, `Form/` (Conditions/Triggers/JustFollowers/CommentTriggerInputs/
  CommentLimitAlert/TargetPostComment), `Contents/` (the full content-type tree +
  `remapTemplateContents.ts`), `TemplatePicker/` (`TemplatePicker.tsx`/`TemplateCard.tsx`),
  `schemas/automationForm.ts`, `constants/automationContent.enum.ts`, `types/` (apiClient,
  buttons/product/validation enums), `utils/p2eNumber.ts`.
- `apps/dashboard/src/components/Automations/AutomationForm.tsx` — reduced to a thin
  wrapper over `AutomationBuilder mode="automation"`; new `templateId` prop/prefill path.
- `apps/dashboard/src/components/Automations/CreateAutomationTemplateDialog.tsx` (new).
- `apps/dashboard/src/app/(Console)/automations/add/page.tsx` — reads `?templateId=`
  (UUID-validated) alongside the existing `?copyFrom=`.
- `apps/dashboard/src/app/(Console)/automations/page.tsx` — wires up
  `CreateAutomationTemplateDialog`.
- `apps/dashboard/src/lib/automationApiClient.ts` (new) — dashboard's
  `AutomationBuilderApiClient` implementation.
- `apps/admin/src/app/(main)/templates/` (new) — `page.tsx`, `client-page.tsx`,
  `templates-table.tsx`, `columns.tsx`, `TemplateForm.tsx`, `add/page.tsx`, `[id]/page.tsx`.
- `apps/admin/src/lib/templateAutomationApiClient.ts` (new) — admin's
  `AutomationBuilderApiClient` implementation.
- Admin sidebar — new `/templates` entry.

## Verification

Unit/component tests added alongside the moved builder and new components (Vitest, under
each module's own `__tests__/`): `AutomationBuilder.test.tsx`, `schema.test.ts`,
`Contents.test.tsx`, `MediaContent.test.tsx`, `remapTemplateContents.test.ts`,
`TemplatePicker.test.tsx`, admin's `TemplateForm.test.tsx` /
`templates-table.test.tsx` / `templates-table.excludes-automations.test.tsx`, dashboard's
`CreateAutomationTemplateDialog.test.tsx` / `AutomationForm.templateId.test.tsx`, plus
regression coverage asserting a template-prefilled submit never targets `/templates` (only
`/contentCycle`) and that the automation/template list endpoints stay separated. No manual
staging pass is recorded in this doc — see the feature's SDD task reports for task-by-task
detail.

## Known limitation

Category-scoped template filtering (a template can be restricted to specific workspace
categories, or set to "applies to all") currently surfaces only "applies-to-all" templates
in both `CreateAutomationTemplateDialog` and the in-form Template insert picker, because the
JWT strategy does not yet populate the requesting workspace's `categoryId` for the backend
to filter by. Category-restricted templates are authored and stored correctly by the admin
UI; they just aren't reachable by category-matched users until that backend gap closes.
