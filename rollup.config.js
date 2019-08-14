import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';

//pck
import pkg from './package.json';
//import autoPreprocess from 'svelte-preprocess';
import json from 'rollup-plugin-json'
import babel from 'rollup-plugin-babel';


const production = !process.env.ROLLUP_WATCH;
const name = pkg.name
  .replace(/^(@\S+\/)?(svelte-)?(\S+)/, '$3')
  .replace(/^\w/, m => m.toUpperCase())
  .replace(/-\w/g, m => m[1].toUpperCase());

console.log(`is prod ${production}`, name);

/**
 * amd – Asynchronous Module Definition, used with module loaders like RequireJS
 * cjs – CommonJS, suitable for Node and other bundlers
 * esm – Keep the bundle as an ES module file, suitable for other bundlers and inclusion as a <script type=module> tag in modern browsers
 * iife – A self-executing function, suitable for inclusion as a <script> tag. (If you want to create a bundle for your application, you probably want to use this.)
 * umd – Universal Module Definition, works as amd, cjs and iife all in one
 * system – Native format of the SystemJS loader
 */


const input = ((!production) ? 'src/main.js' : 'src/components/components.module.js');

const output = ((!production)
? {
    sourcemap: true,
    format: 'iife',
    name: name,
    file: 'public/jsecaptcha.iife.js',
    //dir: 'public/'
  }
: [
    { file: 'dist/jsecaptcha.amd.min.js', format: 'amd', name },
    { file: 'dist/jsecaptcha.es.min.mjs', format: 'es' },
    { file: 'dist/jsecaptcha.iife.min.js', format: 'iife', name },
    { file: 'dist/jsecaptcha.umd.min.js', format: 'umd', name },
    { file: 'dist/jsecaptcha.system.min.js', format: 'system', name },
  ]
);

export default {
  input,
  output,
  plugins: [
    babel({
      runtimeHelpers: true,
    }),
    svelte({
      // enable run-time checks when not in production
      dev: !production,

      /**
       * Auto preprocess supported languages with
       * '<template>'/'external src files' support
       **/
      /*
      preprocess: autoPreprocess({
        postcss: true,
        scss: { includePaths: ['src', 'node_modules'] },
      }),

      customElement: production,
      */
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration —
    // consult the documentation for details:
    // https://github.com/rollup/rollup-plugin-commonjs
    resolve(),
    commonjs({
      include: ['node_modules/**'],
    }),

    json(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // compile to good old IE11 compatible ES5
    babel({
      extensions: [ '.js', '.mjs', '.html', '.svelte' ],
      runtimeHelpers: true,
      exclude: [ 'node_modules/@babel/**', 'node_modules/core-js/**' ],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              ie: '11'
            },
            useBuiltIns: 'usage',
            corejs: 3
          }
        ]
      ],
      plugins: [
        '@babel/plugin-syntax-dynamic-import',
        [
          '@babel/plugin-transform-runtime',
          {
            useESModules: true
          }
        ]
      ]
    }),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};
