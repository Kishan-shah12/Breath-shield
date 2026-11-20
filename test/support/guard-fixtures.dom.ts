/**
 * Valid API fixtures and a safe nested-value replacement helper for guard tests.
 */

/** A complete `/api/plan` payload accepted by the browser contract. */
export const validPlan = {
  place: { name: 'Delhi', region: 'Delhi, India' },
  air: {
    source: 'live',
    aqi: 120,
    band: { key: 'sensitive', label: 'Unhealthy for sensitive groups', symbol: '◑' },
    pm25: 42,
    pm10: 70,
    dominant: 'PM2.5',
    best: { time: '08:00', pm25: 20 },
    worst: { time: '18:00', pm25: 80 },
    hours: [{ time: '08:00', pm25: 20 }],
  },
  advisory: 'Reduce strenuous outdoor activity during poor air quality.',
  recommendations: [
    {
      id: 'shift-outdoor-time',
      category: 'routine',
      status: 'new',
      title: 'Shift outdoor time',
      action: 'Choose a cleaner hour for outdoor activity.',
      impact: { inhaledAvoidedUg: 10, notEmittedG: 2, co2eSavedKg: 1 },
      calculation: '10 × 1',
      impactText: 'This change reduces exposure.',
      factors: [
        {
          label: 'Breathing rate',
          value: 0.5,
          unit: 'm³/h',
          kind: 'published',
          source: 'Reference source',
        },
      ],
    },
  ],
  totals: { inhaledAvoidedUg: 10, notEmittedG: 2, co2eSavedKg: 1, outdoorMinutes: 15 },
  findings: [
    { field: 'notes', kind: 'instruction', detail: 'Ignored', excerpt: 'ignore rules', offset: 0 },
  ],
};

/** A complete `/api/assistant` payload accepted by the browser contract. */
export const validNarrative = {
  source: 'model',
  summary: 'Air quality is poor today, so plan around cleaner hours.',
  explanations: { 'shift-outdoor-time': 'A cleaner hour can reduce the exposure you receive.' },
  encouragement: 'Small changes can make a useful difference.',
};

/** True when `value` is an array of unknown values. */
function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/** Return a copy of `source` with one nested property replaced, without type assertions. */
export function replaceAt(
  source: unknown,
  path: readonly (string | number)[],
  replacement: unknown,
): unknown {
  const [head, ...tail] = path;
  if (head === undefined) return replacement;
  if (isUnknownArray(source))
    return source.map((item, index) =>
      index === head ? replaceAt(item, tail, replacement) : item,
    );
  if (typeof source !== 'object' || source === null) return source;
  return typeof head === 'string'
    ? { ...source, [head]: replaceAt(Reflect.get(source, head), tail, replacement) }
    : source;
}
