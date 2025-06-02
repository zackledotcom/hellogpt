import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const packagesDir = path.join(__dirname, '../packages');
const packageDirs = ['main', 'renderer', 'preload', 'shared'];

async function fileExists(filePath: string) {
  try { await fs.access(filePath); return true; } catch { return false; }
}

async function removeDuplicateJsFiles() {
  for (const pkg of packageDirs) {
    const srcDir = path.join(packagesDir, pkg, 'src');
    if (!(await fileExists(srcDir))) continue;
    const files = await fs.readdir(srcDir);
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const jsFile = file.replace(/\.ts$/, '.js');
        const jsPath = path.join(srcDir, jsFile);
        if (await fileExists(jsPath)) {
          await fs.unlink(jsPath);
          console.log(`[fix] Removed duplicate: ${jsPath}`);
        }
      }
    }
    // modules subdir
    const modulesDir = path.join(srcDir, 'modules');
    if (await fileExists(modulesDir)) {
      const modFiles = await fs.readdir(modulesDir);
      for (const file of modFiles) {
        if (file.endsWith('.ts')) {
          const jsFile = file.replace(/\.ts$/, '.js');
          const jsPath = path.join(modulesDir, jsFile);
          if (await fileExists(jsPath)) {
            await fs.unlink(jsPath);
            console.log(`[fix] Removed duplicate: ${jsPath}`);
          }
        }
      }
    }
  }
}

async function ensureTsconfig(pkg: string) {
  const tsconfigPath = path.join(packagesDir, pkg, 'tsconfig.json');
  if (!(await fileExists(tsconfigPath))) return;
  let tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));
  tsconfig.compilerOptions = tsconfig.compilerOptions || {};
  let changed = false;
  if (tsconfig.compilerOptions.outDir !== 'dist') {
    tsconfig.compilerOptions.outDir = 'dist';
    changed = true;
  }
  if (!tsconfig.compilerOptions.strict) {
    tsconfig.compilerOptions.strict = true;
    changed = true;
  }
  if (changed) {
    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log(`[fix] Updated tsconfig.json for ${pkg}`);
  }
}

async function ensurePackageJson(pkg: string) {
  const pkgJsonPath = path.join(packagesDir, pkg, 'package.json');
  if (!(await fileExists(pkgJsonPath))) return;
  let pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf-8'));
  let changed = false;
  // Ensure files field
  if (!pkgJson.files) {
    pkgJson.files = ['dist/**', 'package.json'];
    changed = true;
  }
  // Ensure exports for renderer
  if (pkg === 'renderer') {
    pkgJson.exports = pkgJson.exports || {};
    if (!pkgJson.exports['./dist/index.html']) {
      pkgJson.exports['./dist/index.html'] = './dist/index.html';
      changed = true;
    }
  }
  if (changed) {
    await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
    console.log(`[fix] Updated package.json for ${pkg}`);
  }
}

async function checkBuildOutputs(pkg: string) {
  const distDir = path.join(packagesDir, pkg, 'dist');
  if (!(await fileExists(distDir))) {
    console.warn(`[fix] Missing dist for ${pkg}, running build...`);
    execSync('npm run build -ws', { stdio: 'inherit' });
  }
}

async function lintAndFormat() {
  try {
    execSync('npx eslint . --ext .ts,.tsx,.js,.jsx --fix', { stdio: 'inherit' });
    execSync('npx prettier --write .', { stdio: 'inherit' });
    console.log('[fix] Linted and formatted codebase.');
  } catch (e) {
    console.warn('[fix] Lint/format skipped (eslint/prettier not found)');
  }
}

async function checkVersions() {
  const requiredNode = 20;
  const nodeVersion = parseInt(process.version.split('.')[0].replace('v', ''));
  if (nodeVersion < requiredNode) {
    console.warn(`[fix] Node.js version is ${process.version}, should be >=${requiredNode}`);
  }
  // TODO: Check Electron, TypeScript, React versions if needed
}

async function checkElectronSecurity() {
  // TODO: Scan main process for contextIsolation, nodeIntegration, etc.
  // For now, just log a reminder
  console.log('[fix] Reminder: Ensure contextIsolation: true and nodeIntegration: false in all BrowserWindow configs.');
}

async function fixProject() {
  try {
    console.log('[fix] Cleaning up duplicate files...');
    await removeDuplicateJsFiles();
    for (const pkg of packageDirs) {
      await ensureTsconfig(pkg);
      await ensurePackageJson(pkg);
      await checkBuildOutputs(pkg);
    }
    await lintAndFormat();
    await checkVersions();
    await checkElectronSecurity();
    console.log('[fix] Rebuilding project...');
    execSync('npm run build -ws', { stdio: 'inherit' });
    console.log('[fix] Project fixed and built successfully. Run `npm run dev` to launch.');
  } catch (error) {
    console.error('[fix] Fix script failed:', error.message);
    process.exit(1);
  }
}

fixProject();
