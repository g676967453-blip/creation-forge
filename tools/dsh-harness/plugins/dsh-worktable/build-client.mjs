import { build } from 'esbuild'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
mkdirSync(join(here, 'lib'), { recursive: true })
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))

const clientBanner = {
  js: "window.__ModuleLoader__.load({ id: 'dsh-worktable', factory: (require) => { var module = { exports: {} }; var exports = module.exports;",
}
const clientFooter = { js: 'return module.exports; } });' }

await build({
  entryPoints: [join(here, 'src/client/index.tsx')],
  outfile: join(here, 'lib/client.js'),
  bundle: true,
  sourcemap: false,
  logLevel: 'info',
  platform: 'browser',
  format: 'cjs',
  target: ['es2020'],
  jsx: 'automatic',
  banner: clientBanner,
  footer: clientFooter,
  define: { __WT_VERSION__: JSON.stringify(pkg.version || '0.3.0') },
  external: [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    '@deepseek-ai/*',
  ],
})
console.log('client build ok')