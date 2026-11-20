// @ts-check
/** API response guards. */
import { CATEGORIES } from './shared/options.js';

/** @typedef {import('../../src/features/plan/view').PlanView} PlanView */
/** @typedef {import('../../src/features/assistant/types').Narrative} Narrative */

/** @param {unknown} v @returns {v is Record<string, unknown>} */
const record = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** @param {unknown} v @returns {v is string} */
const isString = (v) => typeof v === 'string';
/** @param {unknown} v @returns {v is number} */
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
/** @param {unknown} v @returns {v is Record<string, unknown>} */
const impact = (v) =>
  record(v) &&
  finite(v.inhaledAvoidedUg) &&
  finite(v.notEmittedG) &&
  finite(v.co2eSavedKg);
/** @param {unknown} v */
const hourView = (v) => record(v) && isString(v.time) && finite(v.pm25);
/** @param {unknown} v */
const factor = (v) =>
  record(v) &&
  isString(v.label) &&
  finite(v.value) &&
  isString(v.unit) &&
  (v.kind === 'published' || v.kind === 'assumption') &&
  isString(v.source);
/** @param {unknown} v */
const recommendationView = (v) =>
  record(v) &&
  isString(v.id) &&
  CATEGORIES.some((category) => category === v.category) &&
  (v.status === 'new' || v.status === 'keep') &&
  isString(v.title) &&
  isString(v.action) &&
  impact(v.impact) &&
  isString(v.calculation) &&
  isString(v.impactText) &&
  Array.isArray(v.factors) &&
  v.factors.every(factor);
/** @param {unknown} v */
const finding = (v) =>
  record(v) &&
  (v.field === 'place' || v.field === 'notes') &&
  isString(v.kind) &&
  isString(v.detail) &&
  isString(v.excerpt) &&
  finite(v.offset) &&
  Number.isInteger(v.offset) &&
  v.offset >= 0;
/** @param {unknown} v */
const airView = (v) =>
  record(v) &&
  (v.source === 'live' || v.source === 'typical') &&
  finite(v.aqi) &&
  record(v.band) &&
  isString(v.band.key) &&
  ['good', 'moderate', 'sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'].includes(
    v.band.key,
  ) &&
  isString(v.band.label) &&
  isString(v.band.symbol) &&
  finite(v.pm25) &&
  finite(v.pm10) &&
  isString(v.dominant) &&
  hourView(v.best) &&
  hourView(v.worst) &&
  Array.isArray(v.hours) &&
  v.hours.every(hourView);

/** @param {unknown} data @returns {data is PlanView} */
export function isPlanView(data) {
  return (
    record(data) &&
    record(data.place) &&
    isString(data.place.name) &&
    isString(data.place.region) &&
    airView(data.air) &&
    isString(data.advisory) &&
    Array.isArray(data.recommendations) &&
    data.recommendations.every(recommendationView) &&
    impact(data.totals) &&
    finite(data.totals.outdoorMinutes) &&
    Array.isArray(data.findings) &&
    data.findings.every(finding)
  );
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
