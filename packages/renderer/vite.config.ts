import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: mode === 'development' ? '/' : './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: mode === 'development' ? 'inline' : false,
      // Enable minification
      minify: 'terser',
      // Enable chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Configure rollup options
      rollupOptions: {
        output: {
          // Configure chunk size
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
          },
          // Configure asset file names
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            if (/\.(css|scss|sass|less|styl)$/.test(name)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          // Configure chunk file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          // Configure entry file names
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      // Configure terser options
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      reportCompressedSize: true,
      cssCodeSplit: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },
    server: {
      port: 5173,
      strictPort: true,
      // Enable HMR
      hmr: {
        overlay: true,
      },
      // Configure proxy if needed
      proxy: {
        // Add your proxy configuration here
      },
    },
    // Configure CSS options
    css: {
      // Enable CSS modules
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[name]__[local]___[hash:base64:5]',
      },
      // Enable CSS preprocessors
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },
    // Configure optimization options
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@electron-toolkit/preload'],
    },
    // Configure environment variables
    define: {
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
      __APP_ENV__: JSON.stringify(mode),
    },
    // Configure error handling
    logLevel: 'info',
    clearScreen: false,
  };
}); 