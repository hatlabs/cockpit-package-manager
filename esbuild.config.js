#!/usr/bin/env node

import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

const production = process.env.NODE_ENV === 'production';
const watchMode = process.argv.includes('--watch');

// Build CSS separately
const cssContext = await esbuild.context({
    entryPoints: ['./packagemanager/styles.css'],
    bundle: true,
    outfile: './packagemanager/packagemanager.css',
    loader: {
        '.css': 'css',
        '.woff': 'file',
        '.woff2': 'file',
        '.ttf': 'file',
        '.eot': 'file',
        '.svg': 'file',
    },
    logLevel: 'info',
});

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
    await cssContext.watch();
    await context.watch();
    console.log('Watching for changes...');
} else {
    await cssContext.rebuild();
    await context.rebuild();
    await cssContext.dispose();
    await context.dispose();
}
