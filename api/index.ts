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

/** Vercel Edge Function configuration. */
export const config = {
  runtime: 'edge',
};

function resolveTargetUrl(request: Request): URL {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host');
  const proto = request.headers.get('x-forwarded-proto');
  const matched = request.headers.get('x-matched-path') ?? request.headers.get('x-invoke-path');
  if (proto) {
    url.protocol = `${proto}:`;
  }
  if (host) {
    url.host = host;
  }
  if (matched && url.pathname === '/api') {
    url.pathname = matched;
  }
  return url;
}

/**
 * Normalizes the incoming Vercel Edge request to ensure the URL origin and path
 * reflect the public client-facing request even when behind Vercel's rewrite proxy.
 */
function normalizeRequest(request: Request): Request {
  const url = resolveTargetUrl(request);
  return url.toString() === request.url ? request : new Request(url.toString(), request);
}

/** The Vercel request handler for standard Fetch API / Edge runtime. */
export default function handler(request: Request): Response | Promise<Response> {
  return app.fetch(normalizeRequest(request));
}
