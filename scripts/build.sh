#!/bin/sh

# Exit on any error
set -euo pipefail

rm -rf dist
npx tsc -p tsconfig.build.json

# make cli executable (useful for testing)
chmod +x dist/local-client/cli/index.js

# cli assets
cp src/local-client/cdktf/apigw.tpl.yaml dist/local-client/cdktf

# fn-stub: create ready to zip dir and keep only unused deps
mkdir -p dist/fn-stub-zip && cp -R dist/fn-stub dist/helpers dist/fn-stub-zip
npx ts-node scripts/clean-deps dist/fn-stub-zip \
  @yandex-cloud/nodejs-sdk \
  console-log-level \
  ws \
  ydb-sdk

# fn-store: create ready to zip dir and keep only unused deps
mkdir -p dist/fn-store-zip && cp -R dist/fn-store dist/helpers dist/fn-store-zip
npx ts-node scripts/clean-deps dist/fn-store-zip \
  console-log-level \
  ydb-sdk
