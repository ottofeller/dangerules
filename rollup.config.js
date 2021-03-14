import commonjs from '@rollup/plugin-commonjs'
import pkg from './package.json'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

export default {
  input: 'src/index.ts',

  output: {
    exports: 'named',
    file   : pkg.main,
    format : 'cjs',
  },

  plugins: [
    resolve(),

    commonjs({
      exclude: ['src/**/__tests__/**'],
      include: ['node_modules/**'],
    }),

    typescript({
      exclude: ['node_modules/**', 'src/**/__tests__/**'],
    }),
  ],
}
