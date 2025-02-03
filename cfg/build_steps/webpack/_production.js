const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

function getRWSProductionSetup(optimConfig){
  return {
    ...optimConfig,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        terserOptions: {
          keep_classnames: true, // Prevent mangling of class names
          mangle: false, //@error breaks FAST view stuff if enabled for all assets
          compress: {
            dead_code: true,
            pure_funcs: ['console.log', 'console.info', 'console.warn']
          },
          format: {
            comments: false,
            beautify: false
          }
        }
      }),
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: ['default', {
            discardComments: { removeAll: false },
          }],
        },
      })      
    ]
  };
}

module.exports = { getRWSProductionSetup }