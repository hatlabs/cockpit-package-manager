#!/usr/bin/env node

import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const production = process.env.NODE_ENV === 'production';
const watchMode = process.argv.includes('--watch');

// Copy PatternFly CSS - need BOTH base (tokens) and main CSS
const pfBaseSource = path.join(__dirname, 'node_modules/@patternfly/patternfly/patternfly-base.css');
const pfCssSource = path.join(__dirname, 'node_modules/@patternfly/patternfly/patternfly.css');
const pfCssDest = path.join(__dirname, 'packagemanager/packagemanager.css');

// Read both files and concatenate
const baseCSS = fs.readFileSync(pfBaseSource, 'utf8');
const mainCSS = fs.readFileSync(pfCssSource, 'utf8');
const combinedCSS = baseCSS + '\n\n' + mainCSS;

// Write to bind mount location
fs.writeFileSync(pfCssDest, combinedCSS);

// Also write to /tmp to work around Docker for Mac bind mount caching
// Without this, dpkg-buildpackage may read a stale version from the bind mount
try {
    fs.writeFileSync('/tmp/packagemanager.css', combinedCSS);
} catch (e) {
    // /tmp might not be writable, ignore
}

console.log('✓ Copied PatternFly base + CSS');

// Copy fonts
const fontsSource = path.join(__dirname, 'node_modules/@patternfly/patternfly/assets/fonts');
const fontsDir = path.join(__dirname, 'packagemanager');
fs.cpSync(fontsSource, fontsDir, { recursive: true, filter: (src) => src.endsWith('.woff2') || fs.statSync(src).isDirectory() });
console.log('✓ Copied PatternFly fonts');

// Skip CSS bundling - use copied PatternFly CSS directly
const cssContext = null;

// Build JavaScript
const context = await esbuild.context({
    entryPoints: ['./packagemanager/packagemanager.tsx'],
    bundle: true,
    outfile: './packagemanager/packagemanager.js',
    target: 'es2020',
    format: 'esm',
    minify: production,
    sourcemap: !production,
    loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
    },
    external: [
        // No external dependencies - cockpit loaded as global
    ],
    logLevel: 'info',
});

if (watchMode) {
    await context.watch();
    console.log('Watching for changes...');
} else {
    await context.rebuild();
    await context.dispose();
}
