#!/usr/bin/env bash
# Single-PR triage for the dependency / PR automation.
#
# Idempotent and safe to run repeatedly — it is called from:
#   - pr-ci.yml   (once per PR, right after the Build job)
#   - pr-rescan.yml (over every open PR, after a merge and on a schedule)
#
# Decisions, in order (first match wins):
#   1. Author allowlist     — only MattiaIppoliti and Dependabot are auto-handled.
#                             Anyone else's PR is left completely untouched.
#   2. Merge conflict       — Dependabot PRs get "@dependabot rebase"; a human's
#                             own conflicting PR just gets a "needs-rebase" label
#                             (we never rewrite a person's branch automatically).
#   3. Failing "Build"      — dispatch the Claude Code workflow to fix it, once
#                             (guarded by the ci-autofix-attempted label so a
#                             still-broken PR doesn't loop forever).
#   4. Green & conflict-free — squash-merge and delete the branch, then kick a
#                             rescan so any sibling PRs get re-evaluated.
#
# Requires: gh (authenticated via $GH_TOKEN) and jq. One arg: the PR number.
set -euo pipefail

PR="${1:?usage: pr-triage.sh <pr-number>}"
REPO="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY must be set}"

# --- who we auto-handle -----------------------------------------------------
# Your own PRs and your bots. Dependabot is matched by login + bot flag below.
ALLOWED_USER="MattiaIppoliti"
ATTEMPT_LABEL="ci-autofix-attempted"

log()  { echo "::notice title=pr-triage #$PR::$*"; }
skip() { echo "[pr-triage #$PR] skip: $*"; exit 0; }

# --- fetch the PR, waiting out GitHub's async mergeability computation -------
PRJSON=""
for _ in 1 2 3 4 5; do
  if PRJSON="$(gh pr view "$PR" --repo "$REPO" \
      --json number,state,isDraft,author,mergeable,headRefName,labels,statusCheckRollup 2>/dev/null)"; then
    [ "$(jq -r '.mergeable' <<<"$PRJSON")" != "UNKNOWN" ] && break
  fi
  sleep 5
done
[ -n "$PRJSON" ] || skip "could not fetch PR"

STATE="$(jq -r '.state' <<<"$PRJSON")"
[ "$STATE" = "OPEN" ] || skip "PR is $STATE"
[ "$(jq -r '.isDraft' <<<"$PRJSON")" = "true" ] && skip "draft"

MERGEABLE="$(jq -r '.mergeable' <<<"$PRJSON")"
LOGIN="$(jq -r '.author.login' <<<"$PRJSON")"
IS_BOT="$(jq -r '.author.is_bot' <<<"$PRJSON")"
BRANCH="$(jq -r '.headRefName' <<<"$PRJSON")"

# Dependabot's login shows up as "app/dependabot" (GraphQL) or "dependabot[bot]"
# (REST). Match either, but only when it's actually a bot account.
IS_DEPENDABOT=false
case "$LOGIN" in *dependabot*) [ "$IS_BOT" = "true" ] && IS_DEPENDABOT=true ;; esac

# --- 1. author allowlist ----------------------------------------------------
if [ "$LOGIN" != "$ALLOWED_USER" ] && [ "$IS_DEPENDABOT" != "true" ]; then
  skip "author '$LOGIN' is not auto-handled (only $ALLOWED_USER + Dependabot)"
fi

# "Build" is the gating check produced by pr-ci.yml. When pr-ci.yml runs the
# triage right after the job, it passes the result via KNOWN_BUILD_RESULT so we
# don't have to wait for the check rollup to catch up.
BUILD="$(jq -r '[.statusCheckRollup[]? | select(.name=="Build")][-1].conclusion // "NONE"' <<<"$PRJSON")"
case "${KNOWN_BUILD_RESULT:-}" in
  success) BUILD="SUCCESS" ;;
  failure) BUILD="FAILURE" ;;
esac

# --- 2. merge conflict ------------------------------------------------------
if [ "$MERGEABLE" = "CONFLICTING" ]; then
  if [ "$IS_DEPENDABOT" = "true" ]; then
    # Don't spam: skip if we already asked for a rebase in the recent comments.
    RECENT="$(gh pr view "$PR" --repo "$REPO" --json comments \
      -q '[.comments[-10:][]?.body] | map(select(test("@dependabot rebase"))) | length' 2>/dev/null || echo 0)"
    [ "${RECENT:-0}" -gt 0 ] && skip "conflicting, rebase already requested recently"
    log "conflicting Dependabot PR -> requesting rebase"
    gh pr comment "$PR" --repo "$REPO" --body "@dependabot rebase"
  else
    log "conflicting PR by $LOGIN -> labelling needs-rebase (will not rewrite the branch)"
    gh pr edit "$PR" --repo "$REPO" --add-label "needs-rebase" || true
  fi
  exit 0
fi

# --- 3. failing Build -> Claude auto-fix (once) -----------------------------
if [ "$BUILD" = "FAILURE" ]; then
  if jq -e --arg l "$ATTEMPT_LABEL" '.labels[]? | select(.name==$l)' <<<"$PRJSON" >/dev/null; then
    skip "Build failing but Claude already attempted ($ATTEMPT_LABEL) — needs a human"
  fi
  log "Build failing -> dispatching Claude Code to fix"
  gh pr edit "$PR" --repo "$REPO" --add-label "$ATTEMPT_LABEL" || true
  PROMPT="The CI \"Build\" check is failing on PR #$PR (branch \`$BRANCH\`), most likely because a dependency bump introduced breaking API changes. The PR branch is already checked out. Please: (1) run \`pnpm install --no-frozen-lockfile\` then \`pnpm -r build\` to reproduce the failure; (2) fix the source so the build passes — update call sites, types and imports for any changed APIs; (3) do NOT downgrade or change the dependency version that was bumped; (4) commit and push your changes to \`$BRANCH\`. Keep the change minimal and focused on making the build green."
  jq -n --arg pr "$PR" --arg prompt "$PROMPT" \
    '{event_type:"claude", client_payload:{pr:($pr|tonumber), prompt:$prompt}}' \
    | gh api "repos/$REPO/dispatches" --input -
  exit 0
fi

# --- 4. green & conflict-free -> merge --------------------------------------
if [ "$MERGEABLE" = "MERGEABLE" ] && [ "$BUILD" = "SUCCESS" ]; then
  log "green & conflict-free -> squash-merging (incl. major bumps)"
  if gh pr merge "$PR" --repo "$REPO" --squash --delete-branch; then
    # main just moved: re-evaluate sibling PRs (rebase conflicts, merge next).
    # A GITHUB_TOKEN push won't trigger push-based workflows, but workflow_dispatch will.
    gh workflow run pr-rescan.yml --repo "$REPO" >/dev/null 2>&1 || true
  else
    log "merge failed (race / branch protection?) — will retry on next rescan"
  fi
  exit 0
fi

skip "no action (mergeable=$MERGEABLE build=$BUILD)"
