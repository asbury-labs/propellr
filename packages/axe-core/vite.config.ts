import { defineConfig, type Plugin } from 'rolldown-vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { axeAriaPlugin } from '../build-tools/src/vite-plugin-axe-aria';
import { axeMetadataPlugin } from '../build-tools/src/vite-plugin-axe-metadata';

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, 'package.json'), 'utf-8')
);

const banner = `/*! axe v${pkg.version}
 * Copyright (c) 2015 - ${new Date().getFullYear()} Deque Systems, Inc.
 *
 * Your use of this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This entire copyright notice must appear in every copy of this file you
 * distribute or in any file that contains substantial portions of this source
 * code.
 */`;

/**
 * Vite plugin that prepends the license banner to all generated JS files.
 * This runs after minification so the banner is never stripped.
 */
function bannerPlugin(): Plugin {
  return {
    name: 'axe-banner',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir || resolve(__dirname, 'dist');
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          (chunk.type === 'chunk' && fileName.endsWith('.js')) ||
          fileName.endsWith('.mjs') ||
          fileName.endsWith('.cjs')
        ) {
          const filePath = join(outDir, fileName);
          const content = readFileSync(filePath, 'utf-8');
          if (!content.startsWith('/*!')) {
            writeFileSync(filePath, banner + '\n' + content);
          }
        }
      }
    }
  };
}

/**
 * Vite plugin that injects `var axe = {};` and a `window` shim into
 * each output chunk.
 *
 * Many source files reference `axe` as an ambient global (the legacy
 * Grunt build made this available via concatenation / intro.stub).
 * The `window` shim allows the CJS/UMD bundles to load in Node.js
 * without ReferenceErrors.
 *
 * We use `writeBundle` (runs AFTER minification) so the injected code
 * is never stripped by the minifier.
 */
function axeGlobalPlugin(): Plugin {
  return {
    name: 'axe-global-inject',
    apply: 'build',
    writeBundle(options, bundle) {
      const outDir = options.dir || resolve(__dirname, 'dist');
      const shim = [
        'var axe = {};',
        // Use globalThis property assignment (not var) so that setupGlobals
        // can update window/document and all code sees the new values.
        'if (typeof window === "undefined") { globalThis.window = typeof globalThis !== "undefined" ? globalThis : {}; }',
        'if (typeof document === "undefined") { globalThis.document = globalThis.window ? globalThis.window.document : undefined; }'
      ].join('\n');

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') {continue;}
        if (
          !fileName.endsWith('.js') &&
          !fileName.endsWith('.mjs') &&
          !fileName.endsWith('.cjs')
        )
          {continue;}

        const filePath = join(outDir, fileName);
        const content = readFileSync(filePath, 'utf-8');

        // Skip if already injected
        if (content.includes('var axe = {}')) {continue;}

        // Determine where to insert the shim.
        // For all formats, insert after the banner comment if present,
        // otherwise at the very beginning.
        const bannerEnd = content.indexOf('*/');
        let insertPos: number;
        if (bannerEnd !== -1 && bannerEnd < 500) {
          // Insert after the banner comment's closing */
          insertPos = bannerEnd + 2;
        } else {
          insertPos = 0;
        }

        let patched =
          content.slice(0, insertPos) +
          '\n' +
          shim +
          '\n' +
          content.slice(insertPos);

        // The UMD factory creates `axeExport` and returns it, but `load()`
        // configures `_audit` on the outer `axe` object. Since
        // `Object.assign(axe, axeExport)` already copies everything TO axe,
        // we return `axe` instead — it has all methods + the configured audit.
        patched = patched.replace(
          /\n\treturn axeExport;\n\}\);/,
          '\n\treturn axe;\n});'
        );

        writeFileSync(filePath, patched);
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const isMinify = mode === 'minify';

  return {
    plugins: [
      axeMetadataPlugin({
        axeCoreRoot: __dirname
      }),
      bannerPlugin(),
      axeGlobalPlugin(),
      axeAriaPlugin({
        axeCorePath: __dirname
      })
    ],
    resolve: {
      extensions: [
        '.ts',
        '.tsx',
        '.mjs',
        '.js',
        '.mts',
        '.cts',
        '.cjs',
        '.json'
      ]
    },
    build: {
      lib: {
        entry: resolve(__dirname, 'lib/index.ts'),
        name: 'axe',
        formats: isMinify ? ['umd'] : ['umd', 'es', 'cjs'],
        fileName: format => {
          if (isMinify) {return 'axe.min.js';}
          if (format === 'umd') {return 'axe.js';}
          if (format === 'es') {return 'axe.mjs';}
          if (format === 'cjs') {return 'axe.cjs';}
          return `axe.${format}.js`;
        }
      },
      outDir: 'dist',
      sourcemap: true,
      target: 'es2022',
      minify: isMinify ? 'esbuild' : false,
      emptyOutDir: !isMinify
    },
    define: {
      __AXE_VERSION__: JSON.stringify(pkg.version)
    }
  };
});
