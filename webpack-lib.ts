import * as path from 'path';
import {Configuration, EnvironmentPlugin} from 'webpack';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import nodeExternals from 'webpack-node-externals';
import BundleDeclarationsWebpackPlugin from 'bundle-declarations-webpack-plugin';
import ShebangPlugin from 'webpack-shebang-plugin';
import * as env from './src/helpers/env';

const config: Configuration = {
  mode: env.isProd ? 'production' : 'development',
  entry: {
    'local-client': path.resolve('src/local-client/index.ts'),
    cli: path.resolve('src/local-client/cli/index.ts'),
    'cdktf': path.resolve('src/local-client/cdktf/main.ts'),
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
  externalsPresets: {node: true},
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          transpileOnly: true,
        },
      },
      {
        test: /\.node$/,
        loader: "node-loader",
      }
    ]
  },
  optimization: {
    minimize: false,
  },
  plugins: [
    new ShebangPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new BundleDeclarationsWebpackPlugin({
      entry: [
        path.resolve('src/local-client/index.ts')
      ],
      outFile: 'local-client.d.ts',
    }),
    new EnvironmentPlugin({
      APP_ENV: 'development',
      NODE_ENV: env.isProd ? 'production' : 'development',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: path.resolve('src/local-client/cdktf/apigw.tpl.yaml'), to: path.resolve('dist/')}
      ]
    })
  ]
};

export default config;
