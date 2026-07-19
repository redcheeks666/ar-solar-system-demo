export type AppRoute =
  | 'landing'
  | 'debug'
  | 'experience'
  | 'solar-preview';

export interface AppLocationLike {
  readonly pathname: string;
  readonly search: string;
}

export function resolveAppRoute(
  location: AppLocationLike,
  baseUrl: string,
): AppRoute {
  const query = new URLSearchParams(location.search);

  if (query.get('solarPreview') === '1') {
    return 'solar-preview';
  }

  if (query.get('demo') === '1') {
    return 'experience';
  }

  return getPathWithinBase(location.pathname, baseUrl) === '/debug'
    ? 'debug'
    : 'landing';
}

export function getBaseRootPath(baseUrl: string): string {
  const pathname = new URL(baseUrl || '/', 'https://base.invalid').pathname;
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLeadingSlash.endsWith('/')
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
}

export function getExperiencePath(baseUrl: string): string {
  return `${getBaseRootPath(baseUrl)}?demo=1`;
}

function getPathWithinBase(pathname: string, baseUrl: string): string {
  const basePath = getBaseRootPath(baseUrl);
  const baseWithoutTrailingSlash =
    basePath === '/' ? '/' : basePath.slice(0, -1);
  let relativePath = pathname || '/';

  if (basePath !== '/') {
    if (relativePath === baseWithoutTrailingSlash) {
      relativePath = '/';
    } else if (relativePath.startsWith(basePath)) {
      relativePath = `/${relativePath.slice(basePath.length)}`;
    }
  }

  const normalized = `/${relativePath}`.replace(/\/{2,}/g, '/');
  return normalized.length > 1 ? normalized.replace(/\/+$/, '') : normalized;
}
