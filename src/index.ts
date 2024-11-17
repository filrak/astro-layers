import fs from 'node:fs';
import path from 'node:path';

function normalizePath(filePath: any) {
  const filePathStr = filePath instanceof URL ? filePath.pathname : String(filePath);
  
  // TO-DO: decide if I wanna support both
  // Extract the relative path from the full path
  // Look for src/pages or just pages
  const match = filePathStr.match(/(src\/)?pages\/.*$/);
  if (!match) return filePathStr;
  
  return match[0].replace(/^src\//, '');
}

function findMatchingLayerFile(rootDir: any, normalFilePath: any) {
  if (normalFilePath.includes('node_modules')) return null;
  
  const rootDirStr = rootDir instanceof URL ? rootDir.pathname : String(rootDir);
  const layersPath = path.join(rootDirStr, 'layers');
  const relativePath = normalizePath(normalFilePath);
  
  const layers = fs.existsSync(layersPath) 
    ? fs.readdirSync(layersPath).filter(f => 
        fs.statSync(path.join(layersPath, f)).isDirectory())
    : [];
    
  for (const layer of layers) {
    const layerFilePath = path.join(layersPath, layer, relativePath);
    if (fs.existsSync(layerFilePath)) {
      console.log(`Found matching file in layer ${layer}:`, relativePath);
      return layerFilePath;
    }
  }

  return null;
}

export default function layeredFilesPlugin() {
  let rootDir = '';
  
  return {
    name: 'astro-layered-files',
    hooks: {
      'astro:config:setup': ({ command, config }) => {
        rootDir = config.root || process.cwd();
        
        config.vite = config.vite || {};
        config.vite.plugins = config.vite.plugins || [];
        
        config.vite.plugins.push({
          name: 'vite-plugin-layered-files',
          enforce: 'pre',
          
          resolveId(source, importer) {
            if (!importer) return null;
            if (importer.includes('node_modules')) return null;
            
            try {
              const normalizedSource = normalizePath(source);
              const layerFile = findMatchingLayerFile(rootDir, normalizedSource);
              
              if (layerFile) {
                return layerFile;
              }
            } catch (error) {
              console.error('Error in layered files plugin:', error);
            }
            
            return null;
          }
        });
      },
      
      'astro:build:start': ({ buildConfig }) => {
        // Build starts silently now
      }
    }
  };
}