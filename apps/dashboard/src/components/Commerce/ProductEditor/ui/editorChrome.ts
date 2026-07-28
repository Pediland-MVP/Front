/**
 * The product editor's shared visual vocabulary, lifted out of
 * `templates/product-variations/ProductVariations.dc.html`.
 *
 * The design draws its own chrome rather than reusing the app's generic `Card`/`Input`: cards are
 * a 16px radius with a hairline border and `shadow-xs`, inputs get a violet ring on focus, and
 * "add another" actions are dashed rather than solid. These are exported as class strings — not
 * as a wrapper component per element — because most of them land on a plain `<input>` or
 * `<button>` that already carries form wiring, and wrapping those would fight react-hook-form's
 * `register`/`field` spread.
 *
 * Kept in one file so the chrome stays consistent: change the card radius here and every section
 * follows, instead of nine files drifting apart.
 */

/** The card shell every section sits in. */
export const editorCard = 'bg-card border-ln rounded-2xl border shadow-xs';

/**
 * Text input, default size (42px). Focus draws the violet ring the design calls `--glow`;
 * `focus-visible:ring-ring/40` reproduces it with a Tailwind utility so it follows the theme.
 */
export const editorInput =
  'bg-card border-ln h-[42px] w-full rounded-lg border px-3 text-sm outline-none ' +
  'transition-[border-color,box-shadow] hover:border-lnv ' +
  'focus:border-primary focus:ring-ring/40 focus:ring-[3px] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/** Compact input used inside table rows and the right rail (32-36px). */
export const editorInputSm =
  'bg-card border-ln h-8 w-full rounded-md border px-2.5 text-xs outline-none ' +
  'transition-[border-color,box-shadow] hover:border-lnv ' +
  'focus:border-primary focus:ring-ring/40 focus:ring-[3px] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/** Variation-grid cell input — 34px, sits flush in the row. */
export const editorInputCell =
  'bg-card border-ln h-[34px] w-full min-w-0 rounded-md border px-2.5 text-xs outline-none ' +
  'transition-[border-color,box-shadow] ' +
  'focus:border-primary focus:ring-ring/40 focus:ring-[3px] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/**
 * A field that reads as plain text until you touch it — used for the option and spec titles,
 * where a permanent input border would turn a short list into a wall of boxes.
 */
export const editorInputGhost =
  'h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm ' +
  'font-bold outline-none transition-[background-color,border-color,box-shadow] ' +
  'hover:border-lnv hover:bg-card ' +
  'focus:border-primary focus:bg-card focus:ring-ring/40 focus:ring-[3px] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

/** Full-width dashed "add another" button that closes a repeatable list. */
export const editorAddButton =
  'border-lnv bg-card text-primary flex h-[38px] w-full items-center justify-center gap-2 ' +
  'rounded-lg border border-dashed text-sm font-bold transition-colors hover:bg-tint ' +
  'disabled:pointer-events-none disabled:opacity-50';

/** Inline dashed button, for the "افزودن" beside a draft input. */
export const editorAddButtonSm =
  'border-lnv bg-card text-primary h-8 flex-none rounded-md border border-dashed px-3 ' +
  'text-xs font-bold transition-colors hover:bg-tint2 ' +
  'disabled:pointer-events-none disabled:opacity-50';

/** The tinted, bordered sub-box that wraps one option or one spec row. */
export const editorSubBox = 'border-lnv bg-tint rounded-lg border p-3';

/** Bare icon button; hover tints violet. */
export const editorIconButton =
  'text-mut grid size-7 flex-none place-items-center rounded-md transition-colors ' +
  'hover:bg-tint2 hover:text-primary disabled:pointer-events-none disabled:opacity-40';

/** Icon button whose action destroys something; hover tints red. */
export const editorIconButtonDanger =
  'text-mut grid size-7 flex-none place-items-center rounded-md transition-colors ' +
  'hover:bg-dtint hover:text-dtext disabled:pointer-events-none disabled:opacity-40';

/** Rounded chip, e.g. an option value or a tag. */
export const editorChip =
  'border-lnv bg-card inline-flex items-center gap-1.5 rounded-full border ' +
  'py-1 ps-2.5 pe-1 text-xs font-semibold';

/** The dashed "+ suggestion" chip. */
export const editorChipSuggest =
  'border-lnv bg-card text-mut rounded-full border border-dashed px-2.5 py-1 text-xs ' +
  'font-semibold transition-colors hover:border-primary hover:bg-tint2 hover:text-primary';

/** Muted strip used for a card's header or footer band. */
export const editorBand = 'bg-muted border-lnv text-mut text-xs';

/** Empty-state box inside a card. */
export const editorEmptyBox = 'border-ln rounded-lg border border-dashed px-4 py-6 text-center';
