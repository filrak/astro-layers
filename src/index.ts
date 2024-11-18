import type { AstroIntegration } from 'astro'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'

export default function layeredFilesPlugin(): AstroIntegration {
  return {
    name: 'astro-layered-files',
    hooks: {
      'astro:config:setup': ({ command, config, updateConfig }) => {
        const rootDir = config.root || process.cwd()
        const rootDirStr = rootDir instanceof URL ? url.fileURLToPath(rootDir) : rootDir

        const srcDir = new URL(`file://${path.resolve(rootDirStr, './.layers')}/`)

        if (srcDir.pathname === config.srcDir.pathname) {
          if (command === 'dev') {
            const layersPath = path.resolve(rootDirStr, 'layers')
            fs.watch(layersPath, { recursive: true }, () => {
              mergeLayeredFiles(rootDir)
            })
          }
          return
        }

        config.srcDir = srcDir

        mergeLayeredFiles(rootDir)

        updateConfig(config)
      },
    },
  }
}

function mergeLayeredFiles(rootDir: string | URL): string {
  const rootDirStr = rootDir instanceof URL ? url.fileURLToPath(rootDir) : rootDir

  const layersPath = path.resolve(rootDirStr, 'layers')
  const outputPath = path.resolve(rootDirStr, '.layers')

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true })
  }

  // Get layers in reverse order (higher numbers override lower)
  // Might decide to remove this functionality later and opt for config ordering
  const layers = fs.existsSync(layersPath)
    ? fs.readdirSync(layersPath)
      .filter(f => fs.statSync(path.resolve(layersPath, f)).isDirectory())
      .sort((a, b) => b.localeCompare(a))
    : []

  for (const layer of layers) {
    const layerPath = path.resolve(layersPath, layer)
    copyRecursive(layerPath, outputPath)
  }

  return outputPath
}

function copyRecursive(src: any, dest: any): void {
  if (fs.statSync(src).isDirectory()) {
    const files = fs.readdirSync(src)

    files.forEach((file) => {
      const srcPath = path.resolve(src, file)
      const destPath = path.resolve(dest, file)

      if (fs.statSync(srcPath).isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true })
        }
        copyRecursive(srcPath, destPath)
      }
      else {
        fs.copyFileSync(srcPath, destPath)
      }
    })
  }
}
