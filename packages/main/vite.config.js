import { spawn } from 'child_process';
import electronPath from 'electron';
import { getNodeMajorVersion } from '@app/electron-versions';

/**
 * Vite config for Electron main process
 */
export default /** @type {import('vite').UserConfig} */ ({
  build: {
    ssr: true,
    sourcemap: 'inline',
    outDir: 'dist',
    assetsDir: '.',
    target: `node${getNodeMajorVersion()}`,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
    emptyOutDir: true,
    reportCompressedSize: false,
  },
  plugins: [
    handleHotReload(), //  HERE
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
      if (process.env.NODE_ENV !== 'development') return;

      if (electronApp) {
        electronApp.removeListener('exit', process.exit);
        electronApp.kill('SIGINT');
        electronApp = null;
      }

      try {
        electronApp = spawn(String(electronPath), ['--inspect', '.'], {
          stdio: 'inherit',
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
