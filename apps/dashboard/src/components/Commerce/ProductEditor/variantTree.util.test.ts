import { describe, it, expect } from 'vitest';

import {
  aggregate,
  flattenGroups,
  groupVariants,
  SINGLE_GROUP_KEY,
  topKeyOf,
  type VariantGroup,
} from './variantTree.util';

describe('aggregate', () => {
  it('reports a group where every leaf agrees as uniform', () => {
    expect(aggregate([420000, 420000, 420000])).toEqual({
      state: 'uniform',
      value: 420000,
      missing: 0,
    });
  });

  it('reports a disagreeing group as a min-max range', () => {
    expect(aggregate([445000, 420000, 430000])).toEqual({
      state: 'mixed',
      min: 420000,
      max: 445000,
      missing: 0,
    });
  });

  it('reports a group with no values at all as empty', () => {
    expect(aggregate([null, null])).toEqual({ state: 'empty', missing: 2 });
  });

  // The bug this guards: counting an unset price as 0 would show a group as "0 – 445,000" and
  // make an unpriced product look like a free one.
  it('counts nulls as missing rather than folding them in as zero', () => {
    expect(aggregate([420000, null, 445000])).toEqual({
      state: 'mixed',
      min: 420000,
      max: 445000,
      missing: 1,
    });
  });

  // A parent must not claim a price the whole group does not have — otherwise collapsing the
  // group hides the fact that some variations are still unpriced.
  it('is NOT uniform when the set values agree but others are missing', () => {
    const result = aggregate([420000, 420000, null]);

    expect(result.state).toBe('mixed');
    expect(result).toMatchObject({ min: 420000, max: 420000, missing: 1 });
  });

  it('treats Infinity (untracked stock) as an ordinary value, so an all-infinite group is uniform', () => {
    expect(aggregate([Infinity, Infinity])).toEqual({
      state: 'uniform',
      value: Infinity,
      missing: 0,
    });
  });

  it('ranges a group that mixes infinite and counted stock', () => {
    expect(aggregate([Infinity, 5])).toMatchObject({ state: 'mixed', min: 5, max: Infinity });
  });

  it('handles a single leaf and an empty input', () => {
    expect(aggregate([7])).toEqual({ state: 'uniform', value: 7, missing: 0 });
    expect(aggregate([])).toEqual({ state: 'empty', missing: 0 });
  });

  it('does not treat a real zero as missing', () => {
    expect(aggregate([0, 0])).toEqual({ state: 'uniform', value: 0, missing: 0 });
  });
});

describe('topKeyOf', () => {
  it('groups by the first option value index', () => {
    expect(topKeyOf([2, 0, 1])).toBe('2');
  });

  it('puts an option-less variation in the single shared group', () => {
    expect(topKeyOf([])).toBe(SINGLE_GROUP_KEY);
  });
});

interface Row {
  id: string;
  valueIndexes: number[];
}
const row = (id: string, valueIndexes: number[]): Row => ({ id, valueIndexes });
const getIdx = (r: Row) => r.valueIndexes;
const COLOURS = ['مشکی', 'سفید'];

describe('groupVariants', () => {
  it('buckets by first option value, keeping input order inside and between groups', () => {
    const groups = groupVariants(
      [row('a', [0, 0]), row('b', [1, 0]), row('c', [0, 1])],
      getIdx,
      COLOURS,
      2,
    );

    expect(groups.map((g) => g.key)).toEqual(['0', '1']);
    expect(groups[0].rows.map((r) => r.id)).toEqual(['a', 'c']);
    expect(groups[0].label).toBe('مشکی');
    expect(groups[1].label).toBe('سفید');
  });

  it('marks a multi-leaf group as a branch when the product has more than one option', () => {
    const groups = groupVariants([row('a', [0, 0]), row('b', [0, 1])], getIdx, COLOURS, 2);
    expect(groups[0].isBranch).toBe(true);
  });

  // A single-option product would otherwise render as a tree of one-child branches, saying the
  // same thing on the parent and its only leaf.
  it('does not branch when the product has only one option', () => {
    const groups = groupVariants([row('a', [0]), row('b', [1])], getIdx, COLOURS, 1);
    expect(groups.every((g) => g.isBranch)).toBe(false);
  });

  it('does not branch a group that holds a single leaf', () => {
    const groups = groupVariants([row('a', [0, 0]), row('b', [1, 0])], getIdx, COLOURS, 2);
    expect(groups.every((g) => g.isBranch)).toBe(false);
  });

  it('falls back to an empty label when the value index has no matching option value', () => {
    const groups = groupVariants([row('a', [9, 0]), row('b', [9, 1])], getIdx, COLOURS, 2);
    expect(groups[0].label).toBe('');
  });

  it('puts option-less variations in one group with an empty label', () => {
    const groups = groupVariants([row('a', [])], getIdx, [], 0);
    expect(groups[0]).toMatchObject({ key: SINGLE_GROUP_KEY, label: '', isBranch: false });
  });
});

describe('flattenGroups', () => {
  const branch = (key: string, ids: string[]): VariantGroup<Row> => ({
    key,
    label: key,
    rows: ids.map((id) => row(id, [Number(key), 0])),
    isBranch: true,
  });

  it('emits a parent row and hides its leaves while collapsed', () => {
    const flat = flattenGroups([branch('0', ['a', 'b'])], new Set());

    expect(flat).toHaveLength(1);
    expect(flat[0].kind).toBe('group');
  });

  it('emits the parent followed by its leaves when expanded', () => {
    const flat = flattenGroups([branch('0', ['a', 'b'])], new Set(['0']));

    expect(flat.map((f) => f.kind)).toEqual(['group', 'leaf', 'leaf']);
  });

  it('emits a non-branch group as bare leaves with no parent row', () => {
    const flat = flattenGroups(
      [{ key: '0', label: 'مشکی', rows: [row('a', [0])], isBranch: false }],
      new Set(),
    );

    expect(flat.map((f) => f.kind)).toEqual(['leaf']);
  });

  it('expands only the groups named, leaving the others collapsed', () => {
    const flat = flattenGroups([branch('0', ['a', 'b']), branch('1', ['c', 'd'])], new Set(['1']));

    expect(flat.map((f) => f.kind)).toEqual(['group', 'group', 'leaf', 'leaf']);
  });

  // The flat list is what gets handed to the virtualiser, so every emitted leaf must carry its
  // group — a windowed renderer never sees the parent row that scrolled out above it.
  it('carries the owning group on every leaf', () => {
    const flat = flattenGroups([branch('0', ['a'])], new Set(['0']));
    const leaf = flat.find((f) => f.kind === 'leaf');

    expect(leaf).toBeDefined();
    expect(leaf?.kind === 'leaf' && leaf.group.key).toBe('0');
  });
});
