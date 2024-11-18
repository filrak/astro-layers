import fs from 'node:fs';
import path from 'node:path';

function mergeLayeredFiles(rootDir: string | URL) {
  const rootDirStr = rootDir instanceof URL ? rootDir.pathname : rootDir;
  
  const layersPath = path.join(rootDirStr, 'layers');
  const outputPath = path.join(rootDirStr, '.layers');
  
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  // Get layers in reverse order (higher numbers override lower)
  // Might decide to remove this functionality later and opt for config ordering
  const layers = fs.existsSync(layersPath) 
    ? fs.readdirSync(layersPath)
        .filter(f => fs.statSync(path.join(layersPath, f)).isDirectory())
        .sort((a, b) => b.localeCompare(a))
    : [];
    
  for (const layer of layers) {
    const layerPath = path.join(layersPath, layer);
    copyRecursive(layerPath, outputPath);
  }
  
  return outputPath;
}

function copyRecursive(src: any, dest: any) {
  if (fs.statSync(src).isDirectory()) {
    const files = fs.readdirSync(src);
    
    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }
}

export default function layeredFilesPlugin() {
  return {
    name: 'astro-layered-files',
    hooks: {
      'astro:config:setup': ({ command, config }) => {
        const rootDir = config.root || process.cwd();
        mergeLayeredFiles(rootDir);
        
        config.srcDir = new URL('.layers/', rootDir instanceof URL ? rootDir : new URL(`file://${rootDir}`));
        
        if (command === 'dev') {
          const layersPath = path.join(rootDir instanceof URL ? rootDir.pathname : rootDir, 'layers');
          fs.watch(layersPath, { recursive: true }, (eventType, filename) => {
            mergeLayeredFiles(rootDir);
          });
        }
      }
    }
  };
}