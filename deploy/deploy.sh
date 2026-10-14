#!/usr/bin/env bash
# Ships the committed site/ to the projects VPS and points the live symlink at it.
# Usage: deploy/deploy.sh   (from a clean checkout)
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -n "$(git status --porcelain)" ]]; then
	echo "Refusing to deploy uncommitted changes." >&2
	exit 1
fi
sha=$(git rev-parse --short=12 HEAD)
release="/srv/bedroom-planner/releases/$sha"
git archive --format=tar HEAD site | ssh projects "sudo mkdir -p '$release' && sudo tar -x --strip-components=1 -C '$release'"

ssh projects bash -s -- "$release" "$sha" <<'REMOTE'
set -euo pipefail
release=$1
sha=$2
# swap the symlink in one rename so a request never sees a half-switched site
sudo ln -sfn "$release" /srv/bedroom-planner/current.next
sudo mv -T /srv/bedroom-planner/current.next /srv/bedroom-planner/current
echo "$sha" | sudo tee /srv/bedroom-planner/DEPLOYED_SHA >/dev/null
REMOTE

for page in / /plan.html /core.js /core.css; do
	curl -fsS -o /dev/null "https://bedroom.davidteju.dev$page"
done
echo "bedroom.davidteju.dev serves $sha"
