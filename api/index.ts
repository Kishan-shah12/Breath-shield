/**
 * Vercel Serverless & Edge entry point: connects the Hono HTTP application to
 * Vercel's serverless environment, serving /api/plan, /api/assistant and
 * /api/health with live air quality data and deterministic rule-based planning.
 */
import { type AppDeps, createApp } from '../src/app';
import { cachedAir, cachedGeocoder } from '../src/features/air-quality/providers/cached';
import { fallbackAir, fallbackGeocoder } from '../src/features/air-quality/providers/fallback';
import { openMeteoAir } from '../src/features/air-quality/providers/open-meteo-air';
import { openMeteoGeocoder } from '../src/features/air-quality/providers/open-meteo-geocoder';
import { typicalAir } from '../src/features/air-quality/providers/typical-air';
import { typicalGeocoder } from '../src/features/air-quality/providers/typical-geocoder';
import { rulePlanGenerator } from '../src/features/assistant/generators/rules';
import { systemClock } from '../src/lib/clock';
import { consoleLogger } from '../src/lib/logger';
import type { AssetServer, Cache, HttpGet } from '../src/lib/ports';
import type { RateLimiter } from '../src/middleware/rate-limit';

const httpGet: HttpGet = (url, signal) =>
  fetch(url, { signal, headers: { accept: 'application/json' } });

const noopCache: Cache = {
  get: () => Promise.resolve(undefined),
  put: () => Promise.resolve(),
};

const passLimiter: RateLimiter = {
  allow: () => Promise.resolve(true),
};

const missingAssets: AssetServer = {
  fetch: () => Promise.resolve(new Response('Not found', { status: 404 })),
};

/** Build production dependencies for Vercel deployment. */
export function composeVercel(): AppDeps {
  const logger = consoleLogger;
  const geocoder = cachedGeocoder(openMeteoGeocoder(httpGet), noopCache);
  const air = cachedAir(openMeteoAir(httpGet), noopCache);
  return {
    geocoder: fallbackGeocoder(geocoder, typicalGeocoder, logger),
    air: fallbackAir(air, typicalAir(systemClock), logger),
    generator: rulePlanGenerator,
    limiter: passLimiter,
    assets: missingAssets,
    logger,
  };
}

const app = createApp(composeVercel());

/** The Vercel request handler for standard Fetch API / Edge runtime. */
export default function handler(request: Request): Response | Promise<Response> {
  return app.fetch(request);
}
