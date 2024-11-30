import fs from 'node:fs';
import path from 'node:path';

interface FileSystemPaths {
  layers: string;
  output: string;
}

function getDirectoryPaths(rootDir: string | URL): FileSystemPaths {
  const rootPath = rootDir instanceof URL ? rootDir.pathname : rootDir;
  return {
    layers: path.join(rootPath, 'layers'),
    output: path.join(rootPath, '.layers')
  };
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getOrderedLayers(layersPath: string): string[] {
  if (!fs.existsSync(layersPath)) return [];
  
  return fs.readdirSync(layersPath)
    .filter(file => fs.statSync(path.join(layersPath, file)).isDirectory())
    .sort((a, b) => b.localeCompare(a));
}

function copyRecursive(sourcePath: string, destPath: string): void {
  const isDirectory = fs.statSync(sourcePath).isDirectory();
  if (!isDirectory) return;

  const files = fs.readdirSync(sourcePath);
  
  for (const file of files) {
    const srcPath = path.join(sourcePath, file);
    const dstPath = path.join(destPath, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      ensureDirectoryExists(dstPath);
      copyRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function mergeLayeredFiles(rootDir: string | URL): string {
  const paths = getDirectoryPaths(rootDir);
  ensureDirectoryExists(paths.output);
  
  const layers = getOrderedLayers(paths.layers);
  
  for (const layer of layers) {
    const layerPath = path.join(paths.layers, layer);
    copyRecursive(layerPath, paths.output);
  }
  
  return paths.output;
}

function createFileWatcher(rootDir: string | URL): void {
  const paths = getDirectoryPaths(rootDir);
  fs.watch(paths.layers, { recursive: true }, () => {
    mergeLayeredFiles(rootDir);
  });
}

export default function layeredFilesPlugin() {
  return {
    name: 'astro-layered-files',
    hooks: {
      'astro:config:setup': ({ command, config }) => {
        const rootDir = config.root || process.cwd();
        mergeLayeredFiles(rootDir);
        
        config.srcDir = new URL('.layers/', 
          rootDir instanceof URL ? rootDir : new URL(`file://${rootDir}`)
        );
        
        if (command === 'dev') {
          createFileWatcher(rootDir);
        }
      }
    }
  };
}