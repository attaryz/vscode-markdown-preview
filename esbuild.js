require('esbuild').build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  watch: process.argv.includes('--watch'),
}).catch(() => process.exit(1))
