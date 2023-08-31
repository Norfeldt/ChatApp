#!/bin/bash

echo "checking .tool-versions"
set -e

echo "installed version (expected version)"

echo "Node.js: $(node --version) (v$(grep '^nodejs ' .tool-versions | cut -d ' ' -f 2))"
if [[ "$(node --version | sed 's/v//')" != "$(grep '^nodejs ' .tool-versions | cut -d ' ' -f 2)" ]]; then
  echo "Error: Node.js version does not match .tool-versions"
  exit 1
fi

echo "yarn: $(yarn --version) ($(grep '^yarn ' .tool-versions | cut -d ' ' -f 2))"
if [[ "$(yarn --version)" != "$(grep '^yarn ' .tool-versions | cut -d ' ' -f 2)" ]]; then
  echo "Error: Yarn version does not match .tool-versions"
  exit 1
fi

installed_ruby_version=$(ruby --version | awk '{print $2}')
expected_ruby_version=$(grep '^ruby ' .tool-versions | cut -d ' ' -f 2)

echo "ruby: $installed_ruby_version ($expected_ruby_version)"
if [[ "${installed_ruby_version%.*}" != "${expected_ruby_version%.*}" ]]; then
  echo "Error: Ruby version does not match .tool-versions"
  exit 1
fi

echo "All versions match .tool-versions"