/**
 * Contract tests for the nested `/api/assistant` response guard.
 */
import { expect, it } from 'vitest';
import { isNarrative } from '../../public/js/guards.js';
import { replaceAt, validNarrative } from '../support/guard-fixtures.dom';

it('accepts complete narratives and rejects malformed nested API values', () => {
  expect(isNarrative(validNarrative)).toBe(true);
  expect(isNarrative({ ...validNarrative, source: 'rules', explanations: {} })).toBe(true);
  const invalid: Array<[Array<string | number>, unknown]> = [
    [[], null],
    [[], []],
    [['source'], 'cache'],
    [['summary'], null],
    [['explanations'], null],
    [['explanations'], []],
    [['explanations', 'shift-outdoor-time'], 1],
    [['encouragement'], false],
  ];
  for (const [path, value] of invalid)
    expect(isNarrative(replaceAt(validNarrative, path, value))).toBe(false);
});
