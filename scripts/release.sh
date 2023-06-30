#!/bin/bash


if [[ $# -ne 0 ]]; then
  cat <<EOF >&2
usage: $(basename "$0")
EOF
  exit 1
fi

# KIND let's us parameterize the release tag name in the future if we want (ie. add stg)
KIND=prd

set -e

branch="$(git rev-parse --abbrev-ref @)"
echo "Evaluating state of ${branch}..."

git fetch -q origin "${branch}"
if ! git diff --quiet "${branch}" origin/"${branch}"; then
  echo "There are outstanding changes to be merged to ${branch}" >&2
  exit 3
fi

tagname="release-${KIND}-$(git rev-parse --short @)"

for app in "$@"; do
  cat <<EOF
----------------------------------------
  ${app}

EOF

  prev_release=$(git tag -l -n1 --sort='-taggerdate:iso8601' | awk '/'"${app}"'/ {print $1; exit}')
  if [[ -z "${prev_release}" ]]; then
    echo "Failed to locate previous release tag for ${app}!" >&2
    continue
  fi

  echo "  Changes since ${prev_release}:"
  echo
  git log --oneline ${prev_release}..HEAD -- "${app}/"
  echo

  echo "  Files affected since ${prev_release}:"
  echo
  (cd "${app}" && git diff --name-only ${prev_release}..HEAD . | cat)
  echo
done

echo
echo '--------------------------------------------------------------------------------'
read -p "Tag this commit as ${tagname} on ${branch} branch? " yn
case "${yn}" in
[yY] | yes) ;;
*)
  echo 'Refusing to continue' >&2
  exit 4
  ;;
esac

echo
echo '--------------------------------------------------------------------------------'
echo

git tag -a "${tagname}" -m "$*"
git push --atomic origin "${tagname}"
