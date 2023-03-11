#!/bin/sh

# Exit on any error
set -euo pipefail

npm run lint
npm run build
npm t
np --yolo --no-release-draft
