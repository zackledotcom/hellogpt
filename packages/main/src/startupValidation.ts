import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { ChromaClient } from 'chromadb';

interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateStartup(): Promise<ValidationResult> {
  const result: ValidationResult = {
    success: true,
    errors: [],
    warnings: []
  };

  try {
    // Validate main process files
    const mainProcessPath = path.join(__dirname, 'index.cjs');
    if (!fs.existsSync(mainProcessPath)) {
      result.errors.push(`Main process file not found: ${mainProcessPath}`);
      result.success = false;
    }

    // Validate preload script
    const preloadPath = path.join(__dirname, '../preload/dist/index.cjs');
    if (!fs.existsSync(preloadPath)) {
      result.errors.push(`Preload script not found: ${preloadPath}`);
      result.success = false;
    }

    // Validate renderer files
    const rendererPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar', 'renderer')
      : path.join(app.getAppPath(), 'packages', 'renderer', 'dist');

    const requiredRendererFiles = [
      'index.html',
      'assets/index.js',
      'assets/index.css'
    ];

    for (const file of requiredRendererFiles) {
      const filePath = path.join(rendererPath, file);
      if (!fs.existsSync(filePath)) {
        result.errors.push(`Renderer file not found: ${filePath}`);
        result.success = false;
      }
    }

    // Validate ChromaDB
    try {
      const chromaPath = path.join(app.getPath('userData'), 'chroma');
      if (!fs.existsSync(chromaPath)) {
        fs.mkdirSync(chromaPath, { recursive: true });
      }
      
      const chromaClient = new ChromaClient({ path: chromaPath });
      await chromaClient.listCollections();
    } catch (error) {
      result.errors.push(`ChromaDB validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    // Check for development files in production
    if (process.env.NODE_ENV !== 'development') {
      const devFiles = [
        'vite.config.ts',
        'tsconfig.json',
        'package.json'
      ];

      for (const file of devFiles) {
        const filePath = path.join(app.getAppPath(), file);
        if (fs.existsSync(filePath)) {
          result.warnings.push(`Development file found in production: ${filePath}`);
        }
      }
    }

    // Validate app.asar integrity
    if (app.isPackaged) {
      const asarPath = path.join(process.resourcesPath, 'app.asar');
      try {
        await fs.promises.access(asarPath, fs.constants.R_OK);
      } catch (error) {
        result.errors.push(`Cannot access app.asar: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.success = false;
      }
    }

    // Log validation results
    if (result.errors.length > 0) {
      console.error('Startup validation errors:', result.errors);
    }
    if (result.warnings.length > 0) {
      console.warn('Startup validation warnings:', result.warnings);
    }

    return result;
  } catch (error) {
    console.error('Error during startup validation:', error);
    return {
      success: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
} 