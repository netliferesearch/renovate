# renovate

Renovate preset and runner for Netlife's Craft CMS sites. Pairs with
[netliferesearch/craft-ci](https://github.com/netliferesearch/craft-ci), whose verify action is the
check that gates every update PR.

Two things live here:

- `default.json`, the update policy. Every site extends it with one line.
- `config.js` and `.github/workflows/renovate.yml`, a self-hosted Renovate run on a daily schedule.

## Adopt it in a site repo

`renovate.json` at the repo root. Renovate's onboarding PR proposes exactly this:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>netliferesearch/renovate"]
}
```

Then add the repo to `repositories` in `config.js` here. The site also needs branch protection on
`main` requiring the `verify` check, "Allow auto-merge" on, and Dependabot alerts on (Settings →
Advanced Security), otherwise automerge and vulnerability PRs cannot work.

## Policy

Composer only, for now. All Composer dependencies are treated alike.

| Update | PR | When | Merge |
| --- | --- | --- | --- |
| patch | one group, "Craft patches" | weekly, Monday before 06:00 Oslo | automerge when verify is green (off until the first group has been merged by hand) |
| minor | one group, "Craft minors" | monthly, first day before 06:00 Oslo | a developer |
| major | none | never | project work, outside Renovate |
| vulnerability fix | own PR per package | immediately | automerge when it is a patch and automerge is on, otherwise a developer |

Other settings: `rangeStrategy: update-lockfile` so an exact pin like `"3.1.47"` is replaced and a
caret range keeps its range with the lock updated; a Dependency Dashboard issue per site; at most
three open PRs at once; label `renovate`.

The craft-ci verify action may push a "project config" commit onto a Renovate branch with the author
`craft-ci@netlife.no`. That address is in `gitIgnoredAuthors`, so Renovate does not treat the branch as
edited by a human. Keep the two in sync.

## The runner

`.github/workflows/renovate.yml` runs `renovatebot/github-action@v46.3.8` with Renovate `44.165.2`
once a day at 02:00 UTC and on demand. The job uses the Actions environment `renovate`, which is
limited to protected branches, so a PR against this repo never sees the token.

Dry run, to read what Renovate would do without opening anything:

```bash
gh workflow run renovate.yml -f dry-run=full
gh run watch
gh run view --log | grep -E 'DRY-RUN|Craft patches|Craft minors|onboarding'
```

Validate changes locally before a PR:

```bash
bash tests/validate.sh
```

## Token

Secret `RENOVATE_TOKEN` in the `renovate` environment. During the pilot it is a fine-grained personal
access token, resource owner Feedsystem, repository access limited to the pilot repo(s), expiry 90
days, with these permissions:

| Permission | Access |
| --- | --- |
| Contents | read and write |
| Pull requests | read and write |
| Issues | read and write (dependency dashboard) |
| Workflows | read and write |
| Commit statuses | read and write |
| Dependabot alerts | read (vulnerability PRs) |
| Metadata | read |
| Members (organization) | read |

A GitHub App replaces the token for the fleet rollout; `config.js` then switches to app credentials.
The same token value is stored on each site repo as `RENOVATE_PUSH_TOKEN` for craft-ci's project
config commit, and is replaced at the same time.
