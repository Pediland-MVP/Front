# 2026-08-13 — Automation card footer alignment

Full reference: `Front/apps/dashboard/src/components/Automations/AutomationCard.tsx`,
`Front/apps/dashboard/src/components/Automations/AutomationsCardList.tsx`.

## Problem

In the dashboard automations list (`/automations`, card view), the bottom action bar
(**answers / edit / copy / delete**) did not sit on the same line across the cards of one
grid row. An automation **without a title** showed its buttons higher than a titled one
next to it, and the same jump happened for automations **assigned to an Instagram post**.

## Root cause

`AutomationsCardList` renders the cards in a CSS grid
(`grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`). Grid's default
`align-items: stretch` already made every card in a row the same height, so the card
boxes lined up — but the **inside** of the card did not:

- `Card` (`src/components/ui/card.tsx`) is `flex flex-col`.
- `CardContent` had **no `flex-1`**, so it kept its natural content height.
- `CardFooter` therefore sat immediately under the content, and the leftover height of
  the stretched card was dead space **below** the footer.

So the footer's vertical position tracked the content height. Everything that changes
content height moved the buttons:

1. the title / disabled-badge row is conditional (`{(item.title || !item.enabled) && ...}`);
2. `item.instagramPost` adds a `w-20` image column, which narrows the text column and
   makes the "active in" row wrap differently;
3. a long list of Instagram usernames wrapped onto a second line;
4. an automation with zero conditions collapsed the badge row to `0px`.

## Solution

Pin the footer to the card's bottom edge instead of chasing each height source
individually — that fixes every current and future content-height difference at once:

- `Card` gets `h-full` (fills its grid cell even outside a stretching parent).
- `CardContent` gets `flex-1` so it absorbs the leftover height; the footer is pushed to
  the bottom.
- The content's inner row gets `h-full` so the post thumbnail column stretches with it.

Three smaller stabilisers remove the remaining content jitter:

- text column: `min-w-0` (needed for truncation inside a flex row);
- usernames: `truncate` + `shrink-0` on the icon → always one line;
- conditions badge row: `min-h-6` → an automation with no conditions keeps the height of
  one badge row;
- post thumbnail column: `shrink-0` so its `w-20` is never squeezed.

## Changes

| File | Change |
|---|---|
| `apps/dashboard/src/components/Automations/AutomationCard.tsx` | `h-full` on `Card`, `flex-1` on `CardContent`, `h-full` on the content row, plus `min-w-0` / `truncate` / `min-h-6` / `shrink-0` stabilisers |
| `apps/dashboard/src/components/Automations/AutomationCard.layout.test.tsx` | **new** — 7 regression tests |

No API, i18n, or backend change. No new translation keys.

## Verification

`npx vitest run src/components/Automations/AutomationCard.layout.test.tsx` in
`apps/dashboard` — **7/7 pass**.

Watched red first: with `h-full`, `flex-1` and `min-h-6` reverted, **6 of the 7 fail**
(all five footer-position variants + the conditions-row case), then pass again once the
fix is restored.

jsdom has no layout engine, so the tests assert the classes that pin the footer and that
`CardFooter` is the card's last child, across five content shapes: titled, untitled,
untitled + disabled, assigned to a post, and no conditions. Not verified in a real
browser this session.
