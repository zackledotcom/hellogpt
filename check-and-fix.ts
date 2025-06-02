import { access, readFile, writeFile } from 'fs/promises';
import { constants } from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const log = {
  success: (msg: string) => console.log(`✅ ${msg}`),
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  warn: (msg: string) => console.warn(`⚠️  ${msg}`),
  error: (msg: string) => console.error(`❌ ${msg}`),
  fix: (msg: string) => console.log(`🔧 ${msg}`),
};

const root = process.cwd();
const distHtml = path.join(root, 'dist/index.html');
const preloadPath = path.join(root, 'dist/exposed.mjs');
const tailwindConfig = path.join(root, 'tailwind.config.ts');
const viteRendererConfig = path.join(root, 'packages/renderer/vite.config.ts');

async function exists(file: string): Promise<boolean> {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434');
    if (!res.ok) {
      log.warn(`Ollama server responded with status ${res.status}`);
      return false;
    }
    log.success('Ollama is running at http://localhost:11434');
    return true;
  } catch {
    log.error('Ollama is not reachable at http://localhost:11434');
    return false;
  }
}

async function checkRendererOutput() {
  if (await exists(distHtml)) {
    log.success('Renderer output exists (dist/index.html)');
  } else {
    log.error('Renderer output (dist/index.html) is missing. Run `npm run build` or `npm run dev`.');
  }
}

async function checkPreload() {
  if (await exists(preloadPath)) {
    log.success('Preload script exists (dist/exposed.mjs)');
  } else {
    log.error('Preload script missing (dist/exposed.mjs)');
  }
}

async function checkTailwind() {
  if (await exists(tailwindConfig)) {
    log.success('Tailwind config found');
  } else {
    log.error('Tailwind config (tailwind.config.ts) not found');
  }
}

async function checkAndFixRendererViteBase() {
  if (!(await exists(viteRendererConfig))) {
    log.error('Renderer vite.config.ts not found');
    return;
  }

  const viteConfig = await readFile(viteRendererConfig, 'utf-8');
  const baseRegex = /base:\s*['"`]\/['"`]/;

  if (baseRegex.test(viteConfig)) {
    const fixed = viteConfig.replace(baseRegex, "base: './'");
    await writeFile(viteRendererConfig, fixed, 'utf-8');
    log.fix("Fixed renderer vite.config.ts: set base to './'");
  } else {
    log.success("Vite renderer config base is correctly set.");
  }
}

async function runChecks() {
  log.info('Running environment and config checks...\n');

  await checkOllama();
  await checkRendererOutput();
  await checkPreload();
  await checkTailwind();
  await checkAndFixRendererViteBase();

  log.info('\nCheck complete.\n');
}

runChecks().catch(err => {
  log.error('Unexpected failure during checks:');
  console.error(err);
  process.exit(1);
});

