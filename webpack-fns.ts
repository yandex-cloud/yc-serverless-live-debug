import * as path from 'path';
import {Configuration, EnvironmentPlugin} from 'webpack';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as env from './src/helpers/env';

const config: Configuration = {
  mode: env.isProd ? 'production' : 'development',
  entry: {
    'fn-store': {
      import: path.resolve('src/fn-store/index.ts'),
      filename: 'fn-store/index.js',
    },
    'fn-stub': {
      import: path.resolve('src/fn-stub/index.ts'),
      filename: 'fn-stub/index.js'
    }
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve('dist'),
    library: {
      type: 'commonjs',
    }
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true,
        },
      }
    ]
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new EnvironmentPlugin({
      APP_ENV: 'development',
      NODE_ENV: env.isProd ? 'production' : 'development',
    })
  ]
};

export default config;
