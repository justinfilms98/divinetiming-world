import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// See docs/FFMPEG_COMPAT_PATCH.md. Next 16.4 Turbopack cannot build the unpatched file.
const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const installed = JSON.parse(readFileSync(join(root, 'node_modules/@ffmpeg/ffmpeg/package.json'), 'utf8'));
const classes = readFileSync(join(root, 'node_modules/@ffmpeg/ffmpeg/dist/esm/classes.js'), 'utf8');

describe('@ffmpeg/ffmpeg compatibility patch', () => {
  it('pins the exact version the patch was written for', () => {
    const patches = readdirSync(join(root, 'patches')).filter((f) => f.startsWith('@ffmpeg+ffmpeg+'));
    expect(patches).toEqual([`@ffmpeg+ffmpeg+${installed.version}.patch`]);
    expect(pkg.dependencies['@ffmpeg/ffmpeg']).toBe(installed.version);
    expect(pkg.scripts.postinstall).toBe('patch-package');
  });

  it('is applied: the worker is always created from the static bundled URL', () => {
    expect(classes).not.toContain('new URL(classWorkerURL');
    expect(classes).toContain('this.#worker = new Worker(new URL("./worker.js", import.meta.url)');
  });

  it('app code never passes classWorkerURL, which the patch ignores', () => {
    const src = readFileSync(join(root, 'lib/utils/compressMedia.ts'), 'utf8');
    expect(src).not.toContain('classWorkerURL');
  });
});
