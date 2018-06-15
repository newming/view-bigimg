import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { uglify } from 'rollup-plugin-uglify'

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/view-bigimg.js',
    format: 'umd',
    name: 'ViewBigimg'
  },
  plugins: [
    uglify(),
    resolve(),
    babel({
      presets: [
        [
          'env', {
            targets: { browsers: ['android>=4', 'ios>=8'] },
            modules: false
          }
        ]
      ],
      exclude: 'node_modules/**',
    }),
  ]
}