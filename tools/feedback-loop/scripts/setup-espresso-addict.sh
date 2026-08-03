#!/usr/bin/env bash
set -euo pipefail

WORKSPACE=${1:-"$PWD/BDD-Work"}
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"

if [ ! -d BDD_test_generation ]; then
  git clone https://github.com/Talank/BDD_test_generation.git
fi

if [ ! -d target-repo ]; then
  git clone https://github.com/YevShch/Espresso-Addict-Playwright-Cucumber.git target-repo
fi

cd target-repo
git fetch --all --tags
git checkout 24c3160bd0719a66feadf4138d8a6e83caed974e
npm ci
npx playwright install chromium

echo "Target repo installed at $WORKSPACE/target-repo"
