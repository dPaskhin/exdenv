const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  input: './lib/index.js',
  external: 'dotenv',
  output: {
    file: './lib/index.js',
    format: 'cjs',
  },
  plugins: [nodeResolve()],
};
