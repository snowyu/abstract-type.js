const {
  engines: { node },
} = require('./package.json')
// require("@babel/register")({extensions: ['.js', '.ts']})
const presets = [
  [
    '@babel/env',
    {
      // Require the highest node version you can.
      // You should use at least a node version which
      // supports async/await because Babel has been
      // configured without polyfills/generators for
      // async/await.
      targets: {
        node: node.substring(2), // Strip `>=`
      },
    },
  ],
  // If you are not using typescript remove the following line.
  '@babel/preset-typescript',
  // If you are not using flow remove the following line.
  // '@babel/preset-flow',
]

const plugins = [
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-object-rest-spread',
  ['@babel/plugin-proposal-decorators', { legacy: true }],
  [
    'module-resolver',
    {
      root: ['./src'],
      alias: {
        '@lib': './src/lib',
      },
    },
  ],
]

module.exports = {
  presets,
  plugins,

  // ignore: [
  //   '__tests__','__mocks__',
  //   '**/*.spec.js','**/*.test.js',
  //   '**/*.spec.ts','**/*.test.ts',
  // ],

  // For compatibility we generate inline source maps _and_
  // source maps in dedicated files. However due to a bug in babel
  // this option is not honored at the moment.
  sourceMaps: 'both',

  // Retaining lines increases debug-ability but may lead to less
  // readable source code. However if you have to debug for whatever
  // reason it is better to have the lines match up than to have
  // nicer source code.
  retainLines: true,
}
