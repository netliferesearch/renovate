#!/usr/bin/env bash
# Validate the preset, the runner config and the workflow. Run from the repo root.
set -euo pipefail
cd "$(dirname "$0")/.."
npx --yes --package renovate@44 -- renovate-config-validator --strict default.json
RENOVATE_CONFIG_FILE=config.js npx --yes --package renovate@44 -- renovate-config-validator --strict
actionlint .github/workflows/renovate.yml
# The CI author that craft-ci uses for project config commits must be ignored by Renovate,
# otherwise the branch counts as modified by a human and is never automerged.
grep -q '"craft-ci@netlife.no"' default.json
echo "validate: ok"
