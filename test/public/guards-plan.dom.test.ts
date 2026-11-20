/**
 * Contract tests for the nested `/api/plan` response guard.
 */
import { expect, it } from 'vitest';
import { isPlanView } from '../../public/js/guards.js';
import { replaceAt, validPlan } from '../support/guard-fixtures.dom';

const invalidPlanCases: Array<[Array<string | number>, unknown]> = [
  [[], null],
  [[], []],
  [[], 'not an object'],
  [['place'], null],
  [['place', 'name'], 1],
  [['place', 'region'], null],
  [['air'], null],
  [['air', 'source'], 'cached'],
  [['air', 'aqi'], Number.NaN],
  [['air', 'band'], null],
  [['air', 'band', 'key'], 'unknown'],
  [['air', 'band', 'label'], 1],
  [['air', 'band', 'symbol'], null],
  [['air', 'pm25'], Number.NaN],
  [['air', 'pm10'], Number.POSITIVE_INFINITY],
  [['air', 'dominant'], 4],
  [['air', 'best'], null],
  [['air', 'worst'], false],
  [['air', 'hours'], 'not an array'],
  [['air', 'hours', 0], null],
  [['air', 'hours', 0, 'time'], 8],
  [['air', 'hours', 0, 'pm25'], Number.NaN],
  [['advisory'], false],
  [['recommendations'], null],
  [['recommendations', 0], null],
  [['recommendations', 0, 'id'], 1],
  [['recommendations', 0, 'category'], 'unknown'],
  [['recommendations', 0, 'status'], 'done'],
  [['recommendations', 0, 'title'], null],
  [['recommendations', 0, 'action'], 1],
  [['recommendations', 0, 'impact'], null],
  [['recommendations', 0, 'impact', 'inhaledAvoidedUg'], Number.NaN],
  [['recommendations', 0, 'impact', 'notEmittedG'], '2'],
  [['recommendations', 0, 'impact', 'co2eSavedKg'], null],
  [['recommendations', 0, 'calculation'], 1],
  [['recommendations', 0, 'impactText'], null],
  [['recommendations', 0, 'factors'], null],
  [['recommendations', 0, 'factors', 0], null],
  [['recommendations', 0, 'factors', 0, 'label'], false],
  [['recommendations', 0, 'factors', 0, 'value'], Number.NaN],
  [['recommendations', 0, 'factors', 0, 'unit'], null],
  [['recommendations', 0, 'factors', 0, 'kind'], 'estimated'],
  [['recommendations', 0, 'factors', 0, 'source'], 9],
  [['totals'], null],
  [['totals', 'outdoorMinutes'], Number.NaN],
  [['findings'], null],
  [['findings', 0], null],
  [['findings', 0, 'field'], 'system'],
  [['findings', 0, 'kind'], 1],
  [['findings', 0, 'detail'], null],
  [['findings', 0, 'excerpt'], false],
  [['findings', 0, 'offset'], 0.5],
  [['findings', 0, 'offset'], -1],
];

it('accepts a complete plan and rejects malformed nested API values', () => {
  expect(isPlanView(validPlan)).toBe(true);
  expect(isPlanView(replaceAt(validPlan, ['air', 'source'], 'typical'))).toBe(true);
  expect(isPlanView(replaceAt(validPlan, ['recommendations', 0, 'status'], 'keep'))).toBe(true);
  expect(
    isPlanView(replaceAt(validPlan, ['recommendations', 0, 'factors', 0, 'kind'], 'assumption')),
  ).toBe(true);
  expect(isPlanView(replaceAt(validPlan, ['findings', 0, 'field'], 'place'))).toBe(true);
  for (const [path, value] of invalidPlanCases)
    expect(isPlanView(replaceAt(validPlan, path, value))).toBe(false);
});
