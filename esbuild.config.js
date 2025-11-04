#!/usr/bin/env node

import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';

const production = process.env.NODE_ENV === 'production';
const watchMode = process.argv.includes('--watch');

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
        'cockpit',
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
