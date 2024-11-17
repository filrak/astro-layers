# astro-layers

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

## Install

Install the plugin using your preferred package manager:
```bash
pnpm install astro-layers
```

Add the plugin to your `astro.config.mjs`:
```js
import layers from 'astro-layers';

export default defineConfig({
  plugins: [layers()],
  //...
});
```

Now, create a `layers` directory in the root of your project and add some layers to it. Every file you put in a layer will override the default one in `src` folder. 

```
project-root/
  layers/
    layer-1/
      pages/
        index.astro # This will override default index.astro
  src/
    pages/
      index.astro
```

## Layer Priority

Layers are processed in alphabetical order. To control the priority, prefix your layer directories with numbers:

```
your-project/
├── layers/
│   ├── 1.base/
│   │   └── pages/
│   │       └── index.astro
│   ├── 2.theme/
│   │   └── pages/
│   │       └── index.astro
│   └── 3.premium/
│       └── pages/
│           └── index.astro
└── src/
    └── pages/
        └── index.astro
```

In this example:
- `1.base` will be checked first
- `2.theme` will be checked second
- `3.premium` will be checked last

This naming convention makes it easy to:
- Understand the layer priority at a glance
- Insert new layers between existing ones (e.g., `1.5.feature`)
- Maintain a clear loading order without additional configuration

### Example Use Cases

```
layers/
├── 1.base/          # Base components and layouts
├── 2.theme/         # Theme-specific overrides
├── 3.features/      # Feature-specific changes
└── 4.customization/ # Customer-specific customizations
```

## License

[MIT](./LICENSE) License © 2024-PRESENT [Filip Rakowski](https://github.com/filrak)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/astro-layers?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/astro-layers
[npm-downloads-src]: https://img.shields.io/npm/dm/astro-layers?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/astro-layers
[bundle-src]: https://img.shields.io/bundlephobia/minzip/astro-layers?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=astro-layers
[license-src]: https://img.shields.io/github/license/antfu/astro-layers.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/astro-layers/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/astro-layers
