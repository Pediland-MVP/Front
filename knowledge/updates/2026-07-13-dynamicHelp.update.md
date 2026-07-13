# Update: Dynamic Guides (Learnings) Frontend Integration - 2026-07-13

## Problem
The learning/help contents were hardcoded on the client-side, making them impossible for admins to update dynamically. The help buttons used generic icons instead of readable text links, and there was no support for context-sensitive popups driven by backend guide content.

## Solution
Revamped the `/help/learn` page, redesigned the shared `<HelpMeDialog>` component to fetch dynamic help contents using a context `helpId` prop, and implemented a complete admin interface for managing guide categories and rich Markdown articles.

## Changes
- **Admin Panel (`apps/admin`)**:
  - Registered `/guides` route under the advanced children menu of the sidebar (restricted to superAdmins: roles admin/manager; KAM is redirected to not-found).
  - Created a Guides Management dashboard at `/guides` featuring category lists (CRUD) and guides lists (CRUD).
  - Implemented a custom Markdown editor with a toolbar (text styles, headings, list, quote, colors, link, image, and video inserts) and a live preview pane using a custom regex markdown-to-HTML parser.
- **Merchant Dashboard (`apps/dashboard`)**:
  - Restyled the `/help/learn` learning section. It now fetches categories and guides dynamically using SWR and maps them into a clean RTL tabbed category layout, showing video cover images and rendering rich HTML content parsed from Markdown.
  - Revamped `<HelpMeDialog>` to trigger localized text links: `(راهنما)` in Persian and `(help)` in English instead of the old question icon.
  - Extended `<HelpMeDialog>` with a `helpId` prop that uses SWR to pull guide data dynamically from `GET /guides/:helpId`, rendering the video + cover image + rich Markdown content with fallback to hardcoded props if no backend match exists.
  - Linked specific `helpId` values across all dashboard modules (triggers, conditions, comment consent, replies, just followers, reminders, connect instagram).

## Verification
- Added sidebar links and localized strings in Persian and English.
- Validated state synchronization, markdown rendering, and fallback flows.
