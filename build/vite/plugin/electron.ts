import path from 'path';
import electron from 'vite-plugin-electron';
import { nodeResolve } from '@rollup/plugin-node-resolve';

function pathResolve(dir: string) {
  return path.resolve(process.cwd(), '.', dir);
}

export function configElectronPlugin() {
  return [
    electron({
      main: {
        entry: pathResolve('src/main.ts'),
        vite: {
          build: {
            sourcemap: true,
            rollupOptions: {
              external: ['node-pty', 'form-data', 'axios', 'chalk'],
            },
          },
          resolve: {
            alias: [
              {
                find: /\@src\//,
                replacement: pathResolve('src') + '/',
              },
              {
                find: /\@base\//,
                replacement: pathResolve('src/base') + '/',
              },
              {
                find: /\/@\//,
                replacement: pathResolve('src/vue-src') + '/',
              },
              // /#/xxxx => types/xxxx
              {
                find: /\/#\//,
                replacement: pathResolve('src/types') + '/',
              },
            ],
          },

          plugins: [
            nodeResolve({
              preferBuiltins: true,
              browser: false,
              extensions: ['.ts', '.js'],
            }), // 消除碰到 node.js 模块时⚠警告
          ],
        },
      },
      preload: {
        input: {
          // Must be use absolute path, this is the restrict of rollup
          preload: path.join(process.cwd(), 'src/sandbox/preload.ts'),
        },
        vite: {
          build: {
            sourcemap: true,
          },
        },
      },
    }),
  ];
}
