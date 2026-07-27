import type { ProductFormValues } from './productForm.schema';

type OptionValue = ProductFormValues['options'][number]['values'][number];
type Option = ProductFormValues['options'][number];

/**
 * Stable identities for variation diffing, shared by `OptionsSection` (which regenerates the
 * matrix) and `VariantsSection` (which renders it).
 */

// A value's STABLE identity for diffing purposes: its real backend `id` once persisted, or
// the `_localId` assigned the moment it was typed in this session (see `OptionRow`'s
// `addValue`). Never the value's array position — positions shift on reorder/removal, which is
// exactly what broke the old positional diff.
export const getValueIdentity = (value: OptionValue | undefined): string | undefined =>
  value?.id ?? value?._localId;

// A variant combination's diff key is the SORTED set of its selected values' stable
// identities — sorted (not option-position order) so the key survives an option-ROW reorder
// too: reordering options changes which slot in `valueIndexes` a given option occupies, but
// the underlying SET of selected values (and therefore this key) is unchanged.
export const getComboKey = (identities: string[]): string => [...identities].sort().join('|');

export const getComboIdentities = (combo: number[], options: Option[]): string[] =>
  combo.map(
    (valueIndex, optionIndex) => getValueIdentity(options[optionIndex]?.values[valueIndex]) ?? '',
  );
