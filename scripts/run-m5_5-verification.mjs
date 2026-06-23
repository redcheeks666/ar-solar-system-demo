import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

const outDir = '/private/tmp/ar-solar-system-demo-m5_5_verify';
const nodeModulesLink = join(outDir, 'node_modules');

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'package.json'), '{"type":"commonjs"}\n');
rmSync(nodeModulesLink, { recursive: true, force: true });
symlinkSync(join(cwd(), 'node_modules'), nodeModulesLink, 'dir');

execFileSync(
  'tsc',
  [
    '--outDir',
    outDir,
    '--rootDir',
    '.',
    '--noEmit',
    'false',
    '--module',
    'CommonJS',
    '--moduleResolution',
    'Node',
    '--target',
    'ES2020',
    '--skipLibCheck',
    'scripts/verify-m5_5-solar-inspection.ts',
  ],
  { cwd: cwd(), stdio: 'inherit' },
);

execFileSync('node', [join(outDir, 'scripts/verify-m5_5-solar-inspection.js')], {
  cwd: cwd(),
  stdio: 'inherit',
});
