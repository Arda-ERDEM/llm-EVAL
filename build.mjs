import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const isWatch = process.argv.includes('--watch');

async function build() {
  console.log('Building ToS Risk Analyzer Chrome Extension & Core Library...');

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }

  // 1. Core library build (ESM)
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    sourcemap: true,
    external: ['@page-agent/page-controller'],
  });

  // 2. Extension background service worker
  await esbuild.build({
    entryPoints: ['src/extension/background.ts'],
    outfile: 'dist/background.js',
    bundle: true,
    format: 'iife',
    platform: 'browser',
    sourcemap: true,
  });

  // 3. Extension content script
  await esbuild.build({
    entryPoints: ['src/extension/content.ts'],
    outfile: 'dist/content.js',
    bundle: true,
    format: 'iife',
    platform: 'browser',
    sourcemap: true,
  });

  // 4. Extension popup UI script
  await esbuild.build({
    entryPoints: ['src/extension/popup.ts'],
    outfile: 'dist/popup.js',
    bundle: true,
    format: 'iife',
    platform: 'browser',
    sourcemap: true,
  });

  // 5. Copy static assets to dist/
  const staticFiles = [
    { src: 'src/extension/manifest.json', dest: 'dist/manifest.json' },
    { src: 'src/extension/popup.html', dest: 'dist/popup.html' },
    { src: 'src/extension/sidepanel.html', dest: 'dist/sidepanel.html' },
    { src: 'src/extension/popup.css', dest: 'dist/popup.css' },
    { src: 'src/extension/icon.svg', dest: 'dist/icon.svg' },
  ];

  for (const f of staticFiles) {
    if (fs.existsSync(f.src)) {
      fs.copyFileSync(f.src, f.dest);
    }
  }

  console.log('✓ Build completed successfully into dist/');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
