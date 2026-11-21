/**
 * Tests for what public/index.html loads: one module script, its stylesheets,
 * nothing inline and nothing third-party.
 */
import { beforeAll, expect, it } from 'vitest';
import { html } from '../support/markup.dom';
import { mountPage } from '../support/page.dom';
beforeAll(() => {
  mountPage();
});

it('has one module script, four stylesheets, no inline script or style, no third-party origin', () => {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const scripts = [...doc.querySelectorAll('script')];
  expect(scripts).toHaveLength(1);
  const script = scripts[0];
  expect(script?.getAttribute('type')).toBe('module');
  expect(script?.getAttribute('src')).toBe('/js/main.js');
  expect(script?.textContent.trim()).toBe('');

  const inlineScripts = scripts.filter(
    (s) => !s.hasAttribute('src') || s.textContent.trim() !== '',
  );
  expect(inlineScripts).toHaveLength(0);

  const stylesheets = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  expect(stylesheets).toHaveLength(4);

  const styleElements = [...doc.querySelectorAll('style')];
  expect(styleElements).toHaveLength(0);

  const inlineStyleElements = [...doc.querySelectorAll('[style]')];
  expect(inlineStyleElements).toHaveLength(0);

  const urls = [...doc.querySelectorAll('[src], [href], [action]')].map(
    (el) => el.getAttribute('src') ?? el.getAttribute('href') ?? el.getAttribute('action') ?? '',
  );
  const externalUrls = urls.filter(
    (url) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'),
  );
  expect(externalUrls).toHaveLength(0);
});
