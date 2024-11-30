import fs from 'node:fs';
import path from 'node:path';
import { gitget } from 'gitget';

function getDirectoryPaths(rootDir: string | URL) {
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

function getOrderedLayers(layersPath: string, externalPath: string): string[] {
  const localLayers = fs.existsSync(layersPath) 
    ? fs.readdirSync(layersPath)
        .filter(file => fs.statSync(path.join(layersPath, file)).isDirectory())
    : [];
    
  const externalLayers = fs.existsSync(externalPath)
    ? fs.readdirSync(externalPath)
        .filter(file => fs.statSync(path.join(externalPath, file)).isDirectory())
    : [];

  return [...localLayers, ...externalLayers].sort((a, b) => a.localeCompare(b));
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

async function downloadExternalLayers(
  outputPath: string, 
  externalLayers: ExternalLayer
): Promise<void> {
  for (const [layerName, source] of Object.entries(externalLayers)) {
    const layerPath = path.join(outputPath, '.external', layerName);
    ensureDirectoryExists(layerPath);
    await gitget({
      silent: true,
      folder: `./${layerPath}`,
      ...(source.startsWith('npm:') 
        ? { npm: source.replace('npm:', ''), 
      }
        : { 
            user: source.replace('git:', '').split('/')[0],
            repo: source.replace('git:', '').split('/')[1],
          })
    });
  }
}

async function mergeLayeredFiles(
  rootDir: string | URL, 
  options: PluginOptions = {}
): Promise<string> {
  const paths = getDirectoryPaths(rootDir);
  ensureDirectoryExists(paths.output);
  
  if (options.external) {
    const externalPath = path.join(paths.output, '.external');
    ensureDirectoryExists(externalPath);
    const rootPath = rootDir instanceof URL ? rootDir.pathname : rootDir;
    await downloadExternalLayers(paths.output.replace(rootPath, ''), options.external);
  }
  
  const externalPath = path.join(paths.output, '.external');
  const layers = getOrderedLayers(paths.layers, externalPath);
  
  for (const layer of layers) {
    const layerPath = fs.existsSync(path.join(paths.layers, layer))
      ? path.join(paths.layers, layer)
      : path.join(externalPath, layer);
    
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

interface ExternalLayer {
  [key: string]: string; 
}

interface PluginOptions {
  /**
   * External layers to be downloaded from npm or git.
   * `npm:` prefix is used for npm packages, while `git:` is used for git repositories.
   * For example:
   * ```js
   * { '3.premium': 'git:user/repo' }
   * ```
   * The layers will be resolved in the order they are defined.
   * For example, if you have `1.core` and `2.premium` layers, and you define `external: { '3.premium': 'git:user/repo' }`,
   * the `3.premium` layer will be applied after `2.premium` layer.
   */
  external?: ExternalLayer;
}

export default function layers(options: PluginOptions = {}) {
  return {
    name: 'astro-layers',
    hooks: {
      'astro:config:setup': async ({ command, config, logger }) => {
        const rootDir = config.root || process.cwd();
        await mergeLayeredFiles(rootDir, options);
        
        config.srcDir = new URL('.layers/', 
          rootDir instanceof URL ? rootDir : new URL(`file://${rootDir}`)
        );
        
        if (command === 'dev') {
          createFileWatcher(rootDir);
        }
        logger.info('Astro Layers Plugin is loaded. Files are now served up from .layers directory.');
      }
    }
  };
}