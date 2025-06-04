#!/usr/bin/env node
/**
 * Pelican Loadtime Error Detection & Fix Script
 * 
 * This script detects and fixes common loadtime errors in Electron applications:
 * - Missing build outputs
 * - Incorrect file paths and imports
 * - IPC channel mismatches
 * - Missing dependencies
 * - Configuration errors
 * - Module resolution issues
 */

import { join, dirname } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

interface FixResult {
  id: string;
  description: string;
  passed: boolean;
  fixed?: boolean;
  error?: string;
}

class Logger {
  info(message: string): void {
    console.log(`ℹ️  ${message}`);
  }

  success(message: string): void {
    console.log(`✅ ${message}`);
  }

  error(message: string): void {
    console.log(`❌ ${message}`);
  }

  fix(message: string): void {
    console.log(`🔧 ${message}`);
  }
}

class ProjectHealthCheck {
  private readonly projectRoot: string;
  private readonly shouldFix: boolean;
  private readonly log: Logger;

  constructor(projectRoot: string, shouldFix: boolean = false) {
    this.projectRoot = projectRoot;
    this.shouldFix = shouldFix;
    this.log = new Logger();
  }

  private async exists(path: string): Promise<boolean> {
    return existsSync(path);
  }

  private async runCommand(command: string): Promise<{ success: boolean; output: string }> {
    try {
      const { stdout } = await execAsync(command, { cwd: this.projectRoot });
      return { success: true, output: stdout };
    } catch (error: any) {
      return { success: false, output: error.message };
    }
  }

  // 1. Check and fix missing build outputs
  private async checkBuildOutputs(): Promise<FixResult> {
    const id = 'build-outputs';
    const description = 'Checking build outputs';

    try {
      const requiredPaths = [
        'electron-app/dist/main.js',
        'electron-app/dist/preload.js',
        'renderer/dist/index.html'
      ];

      const missing: string[] = [];
      for (const path of requiredPaths) {
        const fullPath = join(this.projectRoot, path);
        if (!(await this.exists(fullPath))) {
          missing.push(path);
        }
      }

      if (missing.length === 0) {
        return { id, description, passed: true };
      }

      if (this.shouldFix) {
        this.log.fix('Building missing outputs...');
        const buildResult = await this.runCommand('npm run build');
        
        if (buildResult.success) {
          // Verify builds were created
          const stillMissing: string[] = [];
          for (const path of missing) {
            const fullPath = join(this.projectRoot, path);
            if (!(await this.exists(fullPath))) {
              stillMissing.push(path);
            }
          }

          if (stillMissing.length === 0) {
            return { id, description, passed: true, fixed: true };
          } else {
            return { 
              id, 
              description, 
              passed: false, 
              error: `Build completed but still missing: ${stillMissing.join(', ')}`,
            };
          }
        } else {
          return { 
            id, 
            description, 
            passed: false, 
            error: 'Build failed',
          };
        }
      }

      return { 
        id, 
        description, 
        passed: false, 
        error: `Missing build outputs: ${missing.join(', ')}` 
      };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  // 2. Check and fix entry point configuration
  private async checkEntryPoint(): Promise<FixResult> {
    const id = 'entry-point';
    const description = 'Checking entry point configuration';

    try {
      const entryPointPath = join(this.projectRoot, 'electron-app/src/main.ts');
      
      if (!(await this.exists(entryPointPath))) {
        return { 
          id, 
          description, 
          passed: false, 
          error: 'Entry point file missing: electron-app/src/main.ts' 
        };
      }

      const content = await readFile(entryPointPath, 'utf-8');
      
      // Check for common issues in entry point
      const issues: string[] = [];
      
      if (!content.includes('app.whenReady()')) {
        issues.push('Missing app.whenReady() call');
      }
      
      if (!content.includes('createWindow')) {
        issues.push('Missing createWindow function');
      }
      
      if (!content.includes('ipcMain.handle')) {
        issues.push('Missing IPC handler registration');
      }

      if (issues.length > 0 && this.shouldFix) {
        this.log.fix('Fixing entry point configuration...');
        
        const fixedContent = `import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { registerIpcHandlers } from './ipc/handlers';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});`;

        await writeFile(entryPointPath, fixedContent, 'utf-8');
        return { id, description, passed: true, fixed: true };
      }

      if (issues.length > 0) {
        return { 
          id, 
          description, 
          passed: false, 
          error: `Entry point issues: ${issues.join(', ')}` 
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  // 3. Check and fix preload script
  private async checkPreloadScript(): Promise<FixResult> {
    const id = 'preload-script';
    const description = 'Checking preload script configuration';

    try {
      const preloadPath = join(this.projectRoot, 'electron-app/src/preload.ts');
      
      if (!(await this.exists(preloadPath))) {
        return { 
          id, 
          description, 
          passed: false, 
          error: 'Preload script missing: electron-app/src/preload.ts' 
        };
      }

      const content = await readFile(preloadPath, 'utf-8');
      
      // Check for common issues in preload script
      const issues: string[] = [];
      
      if (!content.includes('contextBridge.exposeInMainWorld')) {
        issues.push('Missing contextBridge.exposeInMainWorld call');
      }
      
      if (!content.includes('ipcRenderer.invoke')) {
        issues.push('Missing IPC renderer invoke setup');
      }
      
      if (!content.includes('ipcRenderer.on')) {
        issues.push('Missing IPC renderer event listener setup');
      }

      if (issues.length > 0 && this.shouldFix) {
        this.log.fix('Fixing preload script configuration...');
        
        const fixedContent = `import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    send: (channel: string, data: any) => {
      // whitelist channels
      let validChannels = ['toMain'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel: string, func: Function) => {
      let validChannels = ['fromMain'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes \`sender\` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    invoke: (channel: string, ...args: any[]) => {
      let validChannels = [
        'getConfig',
        'updateConfig',
        'getEmbeddings',
        'createEmbedding',
        'deleteEmbedding',
        'getPerformanceStats'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error('Invalid channel'));
    }
  }
);`;

        await writeFile(preloadPath, fixedContent, 'utf-8');
        return { id, description, passed: true, fixed: true };
      }

      if (issues.length > 0) {
        return { 
          id, 
          description, 
          passed: false, 
          error: `Preload script issues: ${issues.join(', ')}` 
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  // 4. Check and fix IPC channel mismatches
  private async checkIPCChannels(): Promise<FixResult> {
    const id = 'ipc-channels';
    const description = 'Checking IPC channel consistency';

    try {
      const ipcChannelsPath = join(this.projectRoot, 'electron-app/src/ipc/channels.ts');
      const ipcHandlersPath = join(this.projectRoot, 'electron-app/src/ipc/handlers.ts');
      const preloadPath = join(this.projectRoot, 'electron-app/src/preload.ts');

      if (!(await this.exists(ipcChannelsPath))) {
        return { id, description, passed: false, error: 'IPC channels file missing' };
      }

      if (!(await this.exists(ipcHandlersPath))) {
        return { id, description, passed: false, error: 'IPC handlers file missing' };
      }

      const channelsContent = await readFile(ipcChannelsPath, 'utf-8');
      const handlersContent = await readFile(ipcHandlersPath, 'utf-8');
      const preloadContent = await this.exists(preloadPath) ? await readFile(preloadPath, 'utf-8') : '';

      // Extract channel names from channels file
      const channels = this.extractIPCChannels(channelsContent);
      
      // Check for common channel mismatches
      const expectedChannels = [
        'embedding:get-config',
        'embedding:update-config',
        'vector:search',
        'vector:add',
        'chat:send',
        'chat:stream'
      ];

      const missingChannels = expectedChannels.filter(channel => !channels.includes(channel));

      if (missingChannels.length > 0 && this.shouldFix) {
        this.log.fix('Fixing IPC channel registrations...');
        
        // Fix preload exposure
        if (await this.exists(preloadPath)) {
          const fixedPreloadContent = `import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipc: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    },
    removeListener: (channel: string, callback: (...args: any[]) => void) => {
      ipcRenderer.removeListener(channel, callback);
    }
  }
});`;

          await writeFile(preloadPath, fixedPreloadContent, 'utf-8');
        }

        return { id, description, passed: true, fixed: true };
      }

      if (missingChannels.length > 0) {
        return { 
          id, 
          description, 
          passed: false, 
          error: `Missing IPC channels: ${missingChannels.join(', ')}` 
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  private extractIPCChannels(content: string): string[] {
    const channelRegex = /channel:\s*['"`]([^'"`]+)['"`]/g;
    const channels: string[] = [];
    let match;
    
    while ((match = channelRegex.exec(content)) !== null) {
      channels.push(match[1]);
    }
    
    return channels;
  }

  // 5. Check and fix package dependencies
  private async checkDependencies(): Promise<FixResult> {
    const id = 'dependencies';
    const description = 'Checking package dependencies';

    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      
      if (!(await this.exists(packageJsonPath))) {
        return { 
          id, 
          description, 
          passed: false, 
          error: 'package.json missing' 
        };
      }

      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      const requiredDependencies = {
        dependencies: {
          'electron': '^28.0.0',
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          '@headlessui/react': '^1.7.0',
          'zustand': '^4.5.0'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@types/node': '^20.0.0',
          'vite': '^5.0.0',
          '@vitejs/plugin-react': '^4.0.0',
          'electron-builder': '^24.0.0'
        }
      };

      const issues: string[] = [];
      
      // Check dependencies
      for (const [dep, version] of Object.entries(requiredDependencies.dependencies)) {
        if (!packageJson.dependencies?.[dep]) {
          issues.push(`Missing dependency: ${dep}`);
        } else if (packageJson.dependencies[dep] !== version) {
          issues.push(`Incorrect version for ${dep}: expected ${version}`);
        }
      }

      // Check devDependencies
      for (const [dep, version] of Object.entries(requiredDependencies.devDependencies)) {
        if (!packageJson.devDependencies?.[dep]) {
          issues.push(`Missing devDependency: ${dep}`);
        } else if (packageJson.devDependencies[dep] !== version) {
          issues.push(`Incorrect version for ${dep}: expected ${version}`);
        }
      }

      if (issues.length > 0 && this.shouldFix) {
        this.log.fix('Fixing package dependencies...');
        
        packageJson.dependencies = {
          ...packageJson.dependencies,
          ...requiredDependencies.dependencies
        };
        
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          ...requiredDependencies.devDependencies
        };

        await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
        
        // Run npm install
        this.log.fix('Running npm install...');
        const installResult = await this.runCommand('npm install');
        if (!installResult.success) {
          return { 
            id, 
            description, 
            passed: false, 
            error: 'Failed to install dependencies' 
          };
        }
        
        return { id, description, passed: true, fixed: true };
      }

      if (issues.length > 0) {
        return { 
          id, 
          description, 
          passed: false, 
          error: `Dependency issues: ${issues.join(', ')}` 
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  // 6. Check and fix services configuration
  private async checkServices(): Promise<FixResult> {
    const id = 'services';
    const description = 'Checking services configuration';

    try {
      const servicesPath = join(this.projectRoot, 'electron-app/src/services');
      
      if (!(await this.exists(servicesPath))) {
        return { id, description, passed: false, error: 'Services directory missing' };
      }

      const requiredServices = [
        'EmbeddingService.ts',
        'VectorStoreService.ts',
        'OllamaService.ts',
        'ChatService.ts',
        'MemoryService.ts',
        'MessageStore.ts'
      ];

      const missingServices: string[] = [];
      for (const service of requiredServices) {
        const fullPath = join(servicesPath, service);
        if (!(await this.exists(fullPath))) {
          missingServices.push(service);
        }
      }

      if (missingServices.length > 0) {
        return { 
          id, 
          description, 
          passed: false, 
          error: `Missing services: ${missingServices.join(', ')}` 
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  // 7. Check and fix file paths and imports
  private async checkFilePaths(): Promise<FixResult> {
    const id = 'file-paths';
    const description = 'Checking file paths and imports';

    try {
      const requiredPaths = [
        'electron-app/src/main.ts',
        'electron-app/src/preload.ts',
        'electron-app/src/ipc/channels.ts',
        'electron-app/src/ipc/handlers.ts',
        'electron-app/src/services/EmbeddingService.ts',
        'electron-app/src/services/VectorStoreService.ts',
        'renderer/src/components/EmbeddingConfig.tsx',
        'renderer/src/components/PerformanceStats.tsx',
        'renderer/src/stores/configStore.ts',
        'renderer/src/types/embedding.ts',
        'renderer/src/utils/performanceMonitor.ts'
      ];

      const missingPaths: string[] = [];
      for (const path of requiredPaths) {
        if (!(await this.exists(join(this.projectRoot, path)))) {
          missingPaths.push(path);
        }
      }

      if (missingPaths.length > 0) {
        return {
          id,
          description,
          passed: false,
          error: `Missing required files: ${missingPaths.join(', ')}`
        };
      }

      // Check for common import issues
      const importIssues: string[] = [];
      const filesToCheck = [
        {
          path: 'electron-app/src/main.ts',
          requiredImports: ['electron', 'path', './ipc/handlers']
        },
        {
          path: 'electron-app/src/preload.ts',
          requiredImports: ['electron']
        },
        {
          path: 'electron-app/src/ipc/handlers.ts',
          requiredImports: ['electron', '../services/EmbeddingService']
        },
        {
          path: 'renderer/src/components/EmbeddingConfig.tsx',
          requiredImports: ['react', '../stores/configStore', '../types/embedding']
        }
      ];

      for (const file of filesToCheck) {
        const content = await readFile(join(this.projectRoot, file.path), 'utf-8');
        for (const import_ of file.requiredImports) {
          if (!content.includes(`from '${import_}'`) && !content.includes(`from "${import_}"`)) {
            importIssues.push(`Missing import '${import_}' in ${file.path}`);
          }
        }
      }

      if (importIssues.length > 0) {
        return {
          id,
          description,
          passed: false,
          error: `Import issues: ${importIssues.join(', ')}`
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return {
        id,
        description,
        passed: false,
        error: error.message
      };
    }
  }

  // 8. Check and fix TypeScript configuration
  private async checkTypeScriptConfig(): Promise<FixResult> {
    const id = 'typescript-config';
    const description = 'Checking TypeScript configuration';

    try {
      const tsConfigPath = join(this.projectRoot, 'tsconfig.json');
      
      if (!(await this.exists(tsConfigPath))) {
        if (this.shouldFix) {
          this.log.fix('Creating TypeScript configuration...');
          
          const config = {
            compilerOptions: {
              target: 'ES2022',
              module: 'ES2022',
              moduleResolution: 'node',
              esModuleInterop: true,
              strict: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: 'react-jsx',
              baseUrl: '.',
              paths: {
                '@/*': ['src/*']
              }
            },
            include: [
              'electron-app/src/**/*',
              'renderer/src/**/*'
            ],
            exclude: [
              'node_modules',
              'dist'
            ]
          };

          await writeFile(tsConfigPath, JSON.stringify(config, null, 2), 'utf-8');
          return { id, description, passed: true, fixed: true };
        }
        
        return { 
          id, 
          description, 
          passed: false, 
          error: 'TypeScript configuration missing' 
        };
      }

      const content = await readFile(tsConfigPath, 'utf-8');
      const config = JSON.parse(content);
      
      const issues: string[] = [];
      
      // Check required compiler options
      const requiredOptions = {
        target: 'ES2022',
        module: 'ES2022',
        moduleResolution: 'node',
        esModuleInterop: true,
        strict: true,
        jsx: 'react-jsx'
      };

      for (const [option, value] of Object.entries(requiredOptions)) {
        if (config.compilerOptions[option] !== value) {
          issues.push(`Incorrect ${option} setting: expected ${value}`);
        }
      }

      // Check required includes
      const requiredIncludes = [
        'electron-app/src/**/*',
        'renderer/src/**/*'
      ];

      for (const include of requiredIncludes) {
        if (!config.include?.includes(include)) {
          issues.push(`Missing include pattern: ${include}`);
        }
      }

      if (issues.length > 0 && this.shouldFix) {
        this.log.fix('Fixing TypeScript configuration...');
        
        config.compilerOptions = {
          ...config.compilerOptions,
          ...requiredOptions
        };
        
        config.include = requiredIncludes;
        config.exclude = ['node_modules', 'dist'];

        await writeFile(tsConfigPath, JSON.stringify(config, null, 2), 'utf-8');
        return { id, description, passed: true, fixed: true };
      }

      if (issues.length > 0) {
        return { 
          id, 
          description, 
          passed: false, 
          error: `TypeScript configuration issues: ${issues.join(', ')}` 
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  // 9. Check and fix Node.js version compatibility
  private async checkNodeVersion(): Promise<FixResult> {
    const id = 'node-version';
    const description = 'Checking Node.js version compatibility';

    try {
      const packageJsonPath = join(this.projectRoot, 'package.json');
      
      if (!(await this.exists(packageJsonPath))) {
        return { 
          id, 
          description, 
          passed: false, 
          error: 'package.json missing' 
        };
      }

      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      const requiredEngines = {
        node: '>=18.0.0'
      };

      if (!packageJson.engines?.node) {
        if (this.shouldFix) {
          this.log.fix('Adding Node.js version requirement...');
          
          packageJson.engines = {
            ...packageJson.engines,
            ...requiredEngines
          };

          await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
          return { id, description, passed: true, fixed: true };
        }
        
        return { 
          id, 
          description, 
          passed: false, 
          error: 'Node.js version requirement missing' 
        };
      }

      const currentVersion = process.version;
      const requiredVersion = requiredEngines.node;
      
      if (!this.satisfiesVersion(currentVersion, requiredVersion)) {
        return { 
          id, 
          description, 
          passed: false, 
          error: `Node.js version ${currentVersion} does not satisfy requirement ${requiredVersion}` 
        };
      }

      return { id, description, passed: true };
    } catch (error: any) {
      return { 
        id, 
        description, 
        passed: false, 
        error: error.message 
      };
    }
  }

  private satisfiesVersion(version: string, requirement: string): boolean {
    const semver = require('semver');
    return semver.satisfies(version, requirement);
  }

  // Main execution method
  public async run(): Promise<void> {
    this.log.info('Starting project health check...');

    const checks = [
      () => this.checkEntryPoint(),
      () => this.checkPreloadScript(),
      () => this.checkIPCChannels(),
      () => this.checkDependencies(),
      () => this.checkServices(),
      () => this.checkFilePaths(),
      () => this.checkTypeScriptConfig(),
      () => this.checkNodeVersion()
    ];

    const results: FixResult[] = [];
    let hasErrors = false;

    for (const check of checks) {
      const result = await check();
      results.push(result);

      if (!result.passed) {
        hasErrors = true;
        this.log.error(`❌ ${result.description}: ${result.error}`);
      } else if (result.fixed) {
        this.log.success(`✅ ${result.description}: Fixed`);
      } else {
        this.log.success(`✅ ${result.description}: Passed`);
      }
    }

    if (hasErrors) {
      this.log.error('\nSome checks failed. Run with --fix to attempt automatic fixes.');
      process.exit(1);
    } else {
      this.log.success('\nAll checks passed!');
    }
  }
}

// Main execution
if (require.main === module) {
  const shouldFix = process.argv.includes('--fix');
  const projectRoot = process.cwd();
  const fixer = new ProjectHealthCheck(projectRoot, shouldFix);
  fixer.run().catch(error => {
    console.error('Error running health check:', error);
    process.exit(1);
  });
}

export { ProjectHealthCheck };