import fs from 'node:fs';
import path from 'node:path';

function normalizePath(filePath: any) {
  // Convert potential URL objects to strings
  const filePathStr = filePath instanceof URL ? filePath.pathname : String(filePath);
  
  // Extract the relative path from the full path
  // Look for src/pages or just pages
  const match = filePathStr.match(/(src\/)?pages\/.*$/);
  if (!match) return filePathStr;
  
  // Return just the pages/... part
  return match[0].replace(/^src\//, '');
}

function findMatchingLayerFile(rootDir: any, normalFilePath: any) {
  if (normalFilePath.includes('node_modules')) return null;
  
  const rootDirStr = rootDir instanceof URL ? rootDir.pathname : String(rootDir);
  const layersPath = path.join(rootDirStr, 'layers');
  
  console.log('Original path:', normalFilePath);
  const relativePath = normalizePath(normalFilePath);
  console.log('Relative path to search:', relativePath);
  
  // Get all layer directories
  const layers = fs.existsSync(layersPath) 
    ? fs.readdirSync(layersPath).filter(f => 
        fs.statSync(path.join(layersPath, f)).isDirectory())
    : [];
    
  console.log('Available layers:', layers);
  
  // Search through each layer
  for (const layer of layers) {
    const layerFilePath = path.join(layersPath, layer, relativePath);
    console.log('Checking layer path:', layerFilePath);
    
    if (fs.existsSync(layerFilePath)) {
      console.log('Found matching layer file:', layerFilePath);
      return layerFilePath;
    }
  }

  console.log('No matching layer file found');
  return null;
}

export default function layeredFilesPlugin() {
  let rootDir = '';
  
  return {
    name: 'astro-layered-files',
    hooks: {
      'astro:config:setup': ({ command, config }) => {
        rootDir = config.root || process.cwd();
        
        // Add virtual module resolution
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
              if (source.endsWith('.astro')) {
                console.log('Trying to resolve:', source);
                console.log('Normalized to:', normalizedSource);
              }
              
              // Check if there's a matching file in any layer
              const layerFile = findMatchingLayerFile(rootDir, normalizedSource);
              
              if (layerFile) {
                return layerFile;
              }
            } catch (error) {
              console.error('Error in layered files plugin:', error);
            }
            
            return null; // Fall back to default resolution
          }
        });
      },
      
      'astro:build:start': ({ buildConfig }) => {
        console.log('Building with layered files support enabled');
      }
    }
  };
}