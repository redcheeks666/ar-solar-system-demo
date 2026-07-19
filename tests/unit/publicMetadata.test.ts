import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const FAVICON = readFileSync(
  resolve(process.cwd(), 'public/favicon.svg'),
  'utf8',
);

describe('public metadata', () => {
  it('provides Chinese search and social-card copy', () => {
    expect(INDEX_HTML).toContain(
      '<title>AR 太阳系｜摄像头手势互动体验</title>',
    );
    expect(INDEX_HTML).toContain('property="og:title"');
    expect(INDEX_HTML).toContain('property="og:description"');
    expect(INDEX_HTML).toContain('name="twitter:card" content="summary"');
    expect(INDEX_HTML).toContain('name="twitter:title"');
    expect(INDEX_HTML).toContain('name="twitter:description"');
  });

  it('uses a real base-aware SVG favicon and records the pending share image', () => {
    expect(INDEX_HTML).toContain('href="%BASE_URL%favicon.svg"');
    expect(INDEX_HTML).toContain('TODO: og:image 待用户提供分享图');
    expect(FAVICON).toContain('<svg');
    expect(FAVICON).toContain('viewBox="0 0 64 64"');
  });
});
