const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');

module.exports = {
  input: './src/main/index.ts',
  external: 'dotenv',
  output: {
    file: './lib/index.js',
    format: 'cjs',
  },
  plugins: [typescript(), nodeResolve(), terser()],
};
