const { nodeResolve } = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');

module.exports = {
  input: './lib/index.js',
  external: 'dotenv',
  output: {
    file: './lib/index.js',
    format: 'cjs',
  },
  plugins: [nodeResolve(), terser()],
};
