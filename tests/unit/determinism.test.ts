import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guardrail: gesture controllers must stay deterministic given (input, timestamp). Time and
// randomness are injected, never read inside src/interaction/**. If this fails, a module
// introduced a hidden clock or RNG that would make the gesture tests flaky.

const interactionDir = fileURLToPath(new URL('../../src/interaction', import.meta.url));
const BANNED = ['Math.random(', 'Date.now(', 'performance.now('];

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory()
      ? tsFiles(full)
      : name.endsWith('.ts')
        ? [full]
        : [];
  });
}

describe('determinism guardrail (src/interaction)', () => {
  const files = tsFiles(interactionDir);

  it('finds interaction source files to scan', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const name = file.split('/interaction/')[1] ?? file;
    it(`${name} injects time/randomness (no clock or RNG calls)`, () => {
      const source = readFileSync(file, 'utf8');
      for (const token of BANNED) {
        expect(source.includes(token), `${name} must not call ${token}`).toBe(false);
      }
    });
  }
});
