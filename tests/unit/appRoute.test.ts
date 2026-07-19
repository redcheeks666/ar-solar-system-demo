import { describe, expect, it } from 'vitest';
import {
  getBaseRootPath,
  getExperiencePath,
  resolveAppRoute,
} from '../../src/landing/appRoute';

describe('resolveAppRoute', () => {
  it.each([
    ['/', '', '/', 'landing'],
    ['/debug', '', '/', 'debug'],
    ['/debug/', '', '/', 'debug'],
    ['/', '?demo=1', '/', 'experience'],
    ['/', '?solarPreview=1', '/', 'solar-preview'],
    ['/foo/', '', '/foo/', 'landing'],
    ['/foo/debug', '', '/foo/', 'debug'],
    ['/foo/debug/', '', '/foo/', 'debug'],
    ['/foo/', '?demo=1', '/foo/', 'experience'],
    ['/foo/', '?solarPreview=1', '/foo/', 'solar-preview'],
  ] as const)(
    'maps %s%s under base %s to %s',
    (pathname, search, baseUrl, expected) => {
      expect(resolveAppRoute({ pathname, search }, baseUrl)).toBe(expected);
    },
  );

  it('gives the solar preview query precedence over demo mode', () => {
    expect(
      resolveAppRoute(
        { pathname: '/', search: '?demo=1&solarPreview=1' },
        '/',
      ),
    ).toBe('solar-preview');
  });

  it('routes unknown paths back to the landing shell', () => {
    expect(
      resolveAppRoute({ pathname: '/not-a-route', search: '' }, '/'),
    ).toBe('landing');
  });
});

describe('base-aware route links', () => {
  it.each([
    ['/', '/', '/?demo=1'],
    ['/foo/', '/foo/', '/foo/?demo=1'],
    ['/foo', '/foo/', '/foo/?demo=1'],
  ] as const)('builds links for %s', (baseUrl, root, experience) => {
    expect(getBaseRootPath(baseUrl)).toBe(root);
    expect(getExperiencePath(baseUrl)).toBe(experience);
  });
});
