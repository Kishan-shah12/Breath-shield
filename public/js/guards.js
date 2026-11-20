// @ts-check
/** API response guards. */
import { CATEGORIES } from './shared/options.js';

/** @typedef {import('../../src/features/plan/view').PlanView} PlanView */
/** @typedef {import('../../src/features/assistant/types').Narrative} Narrative */
/** @typedef {Record<string, unknown>} Rec */
/** @typedef {(v: unknown) => boolean} C */
/** @typedef {(v: Rec) => boolean} CR */

/** @param {unknown} v @returns {v is Rec} */
const record = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** @param {unknown} v @returns {v is string} */
const isString = (v) => typeof v === 'string';
/** @param {unknown} v @returns {v is number} */
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
/** @param {unknown} v @returns {v is Rec} */
const impact = (v) =>
  record(v) && finite(v.inhaledAvoidedUg) && finite(v.notEmittedG) && finite(v.co2eSavedKg);

/** @type {C} */
const hourView = (v) => record(v) && isString(v.time) && finite(v.pm25);
/** @type {C} */
const factor = (v) =>
  record(v) &&
  isString(v.label) &&
  finite(v.value) &&
  isString(v.unit) &&
  (v.kind === 'published' || v.kind === 'assumption') &&
  isString(v.source);

/** @type {C} */
const isCategory = (v) => CATEGORIES.some((c) => c === v);
/** @type {C} */
const isStatus = (v) => v === 'new' || v === 'keep';
/** @type {CR} */
const recText = (v) =>
  isString(v.title) && isString(v.action) && isString(v.calculation) && isString(v.impactText);
/** @type {C} */
const recommendationView = (v) =>
  record(v) &&
  isString(v.id) &&
  isCategory(v.category) &&
  isStatus(v.status) &&
  recText(v) &&
  impact(v.impact) &&
  Array.isArray(v.factors) &&
  v.factors.every(factor);

/** @type {C} */
const isField = (v) => v === 'place' || v === 'notes';
/** @type {C} */
const finding = (v) =>
  record(v) &&
  isField(v.field) &&
  isString(v.kind) &&
  isString(v.detail) &&
  isString(v.excerpt) &&
  Number.isInteger(v.offset) &&
  Number(v.offset) >= 0;

/** @type {C} */
const aqiBand = (v) =>
  record(v) &&
  isString(v.key) &&
  ['good', 'moderate', 'sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'].includes(v.key) &&
  isString(v.label) &&
  isString(v.symbol);

/** @type {C} */
const isSource = (v) => v === 'live' || v === 'typical';
/** @type {CR} */
const airForecast = (v) =>
  hourView(v.best) && hourView(v.worst) && Array.isArray(v.hours) && v.hours.every(hourView);
/** @type {C} */
const airView = (v) =>
  record(v) &&
  isSource(v.source) &&
  finite(v.aqi) &&
  aqiBand(v.band) &&
  finite(v.pm25) &&
  finite(v.pm10) &&
  isString(v.dominant) &&
  airForecast(v);

/** @type {C} */
const place = (v) => record(v) && isString(v.name) && isString(v.region);
/** @type {CR} */
const planItems = (d) =>
  place(d.place) &&
  impact(d.totals) &&
  finite(d.totals.outdoorMinutes) &&
  Array.isArray(d.recommendations) &&
  d.recommendations.every(recommendationView) &&
  Array.isArray(d.findings) &&
  d.findings.every(finding);

/** @param {unknown} data @returns {data is PlanView} */
export function isPlanView(data) {
  return record(data) && airView(data.air) && isString(data.advisory) && planItems(data);
}

/** @param {unknown} data @returns {data is Narrative} */
export function isNarrative(data) {
  return (
    record(data) &&
    (data.source === 'model' || data.source === 'rules') &&
    isString(data.summary) &&
    record(data.explanations) &&
    Object.values(data.explanations).every(isString) &&
    isString(data.encouragement)
  );
}
