import { spawn } from 'child_process';
import electronPath from 'electron';
import { getNodeMajorVersion } from '@app/electron-versions';
import { defineConfig } from 'vite';
import fs from 'fs';
import { resolve } from 'path';

/**
 * Vite config for Electron main process
 */
export default defineConfig({
  build: {
    ssr: true,
    sourcemap: 'inline',
    outDir: 'dist',
    assetsDir: '.',
    target: `node${getNodeMajorVersion()}`,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.cjs'
    },
    rollupOptions: {
      external: ['electron', 'path', 'child_process', 'util', 'chromadb'],
      output: {
        entryFileNames: '[name].cjs'
      }
    },
    emptyOutDir: true,
    reportCompressedSize: false,
    minify: true,
  },
  plugins: [
    handleHotReload(), //  HERE
    {
      name: 'check-entry',
      configResolved() {
        if (!fs.existsSync('src/index.ts')) {
          throw new Error('Main process entry src/index.ts missing');
        }
      }
    }
  ],
});

// 🔁 Hot reload plugin definition
function handleHotReload() {
  let electronApp = null;
  let rendererWatchServer = null;

  return {
    name: '@app/main-process-hot-reload',

    config(config, env) {
      if (env.mode !== 'development') return;

      const provider = config.plugins.find(p => p.name === '@app/renderer-watch-server-provider');
      if (!provider) throw new Error('Renderer watch server provider not found');

      rendererWatchServer = provider.api.provideRendererWatchServer();

      const devUrl = rendererWatchServer?.resolvedUrls?.local?.[0];
      if (!devUrl) throw new Error('Renderer dev server URL not found');

      process.env.VITE_DEV_SERVER_URL = devUrl;

      return { build: { watch: {} } };
    },

    writeBundle() {
      // IMPORTANT: Only spawn Electron in production builds. In development,
      // the 'start' script handles launching Electron.
      if (process.env.NODE_ENV === 'development') return;

      if (electronApp) {
        electronApp.removeListener('exit', process.exit);
        electronApp.kill('SIGINT');
        electronApp = null;
      }

      try {
        console.log(`Attempting to spawn Electron from path: ${electronPath}`);
        // Redirect stdout and stderr to files
        const stdoutLog = fs.openSync('electron_stdout.log', 'w');
        const stderrLog = fs.openSync('electron_stderr.log', 'w');

        electronApp = spawn(String(electronPath), ['--inspect', '.'], {
          stdio: ['ignore', stdoutLog, stderrLog],
        });

        electronApp.addListener('exit', (code) => {
          console.log(`Electron exited with code ${code}`);
          process.exit(code ?? 0);
        });
      } catch (err) {
        console.error(' Failed to start Electron:', err);
      }
    },
  };
}
