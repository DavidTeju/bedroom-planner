#!/usr/bin/env bash
# Makes the pushed HEAD of main live on the projects VPS. GitHub Actions builds every push and
# stages it there as bedroom-planner:next; this promotes it and checks the pages load.
# Usage: deploy/deploy.sh   (from a clean checkout of a pushed main)
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -n "$(git status --porcelain)" ]]; then
	echo "Refusing to deploy uncommitted changes." >&2
	exit 1
fi
git fetch --quiet origin main
sha=$(git rev-parse HEAD)
if [[ "$sha" != "$(git rev-parse origin/main)" ]]; then
	echo "HEAD is not origin/main; push it (CI only builds main) or check out origin/main." >&2
	exit 1
fi

# Wait for the Image workflow that builds this commit, so its image is staged.
run=$(gh run list --workflow image.yml --commit "$sha" --limit 1 --json databaseId --jq '.[0].databaseId')
if [[ -z "$run" ]]; then
	echo "No Image workflow run for $sha yet; wait a few seconds and retry." >&2
	exit 1
fi
gh run watch "$run" --exit-status --interval 10 >/dev/null

# Copies the site out of the image and swaps the `current` symlink in one rename.
ssh projects "sudo deploy-app bedroom-planner promote $sha"
for page in / /plan.html /core.js /core.css; do
	curl -fsS -o /dev/null "https://bedroom.davidteju.dev$page"
done
echo "bedroom.davidteju.dev serves ${sha:0:12}"
