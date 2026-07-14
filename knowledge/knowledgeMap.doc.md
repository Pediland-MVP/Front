# Front Knowledge Map

This document indexes all documentation files inside the `Front/knowledge` directory.

| File Name / Folder | Path | Description |
|---|---|---|
| `front-back-relations.md` | `Front/knowledge/front-back-relations.md` | Documents the relationships and API dependencies between the Front and the Back projects. |
| `knowledgeMap.doc.md` | `Front/knowledge/knowledgeMap.doc.md` | Indexes and describes all documentation files in this folder. |
| `updates/` | `Front/knowledge/updates/` | Folder containing date-stamped markdown updates for individual features and bug fixes. |
| `2026-07-12-subscriptionDisplayPolish.update.md` | `Front/knowledge/updates/2026-07-12-subscriptionDisplayPolish.update.md` | Summary of subscription validity merging and reserved subscription UI polish. |
| `2026-07-12-userDetailsCardSubscriptionInfo.update.md` | `Front/knowledge/updates/2026-07-12-userDetailsCardSubscriptionInfo.update.md` | Summary of removing the top-level credit/renewal row and displaying remaining subscription days next to Instagram profiles. |
| `2026-07-13-mobileExportFormsResponsiveness.update.md` | `Front/knowledge/updates/2026-07-13-mobileExportFormsResponsiveness.update.md` | Summary of the shared Drawer/DialogStyled scroll fix and the date-picker font-size fix (iOS Safari zoom-on-focus) across the Sessions/Orders/Contacts excel-export forms and the Contacts edit dialog. |
| `2026-07-13-hideSubscriptionFromWebView.update.md` | `Front/knowledge/updates/2026-07-13-hideSubscriptionFromWebView.update.md` | Summary of detecting the Android WebView via the UA `wv` marker and hiding credit-type subscription info plus all navigation to `/settings/subscription` in that context. |
| `2026-07-13-installSection.update.md` | `Front/knowledge/updates/2026-07-13-installSection.update.md` | Summary of the new `/install` page (Android store links / iOS PWA-install steps by device) and its sidebar entry. |
| `2026-07-13-automationCopy.update.md` | `Front/knowledge/updates/2026-07-13-automationCopy.update.md` | Summary of the "Copy" button on automation cards that pre-fills `/automations/add` from an existing automation's full content (including Instagram accounts), always creating a new, independent automation. |
| `2026-07-13-accountSessions.update.md` | `Front/knowledge/updates/2026-07-13-accountSessions.update.md` | Summary of the new `/settings/account-session-management` ("نشست‌های فعال حساب") page that lists the user's active login sessions (`GET /auth/sessions`), pins the current device, and terminates sessions older than 5 days (`DELETE /auth/sessions/:id`). |
