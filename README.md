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
| patch | one group, "Craft patches", releases at least 3 days old | weekly, Monday before 06:00 Oslo | automerge when verify is green (on since 19 Oct 2026) |
| minor | one group, "Craft minors", releases at least 3 days old, labelled `preview` | monthly, first day before 06:00 Oslo | a developer, with a preview site |
| major | none | never | project work, outside Renovate |
| vulnerability fix | own PR per package, to the lowest version that fixes the advisory | immediately | automerge when it is a patch and automerge is on, otherwise a developer |

Vulnerability PRs go to the lowest release that fixes the advisory (`vulnerabilityFixStrategy: lowest`,
Renovate's default). That keeps a security fix a patch whenever the maintainer shipped one, so it
automerges on green verify, and the next minor of the same package arrives through the monthly group
with a preview and a developer. The pilot ran with `highest` until 4 Nov 2026, when the fix for
`yiisoft/yii2-redis` (advisory fixed in 2.0.20) opened at 2.1.2 instead, a minor whose new
`ConnectionInterface` breaks nch's cache config, so a PR meant to merge on its own needed a developer.
`highest` had been chosen because the lowest fix can still pin a vulnerable dependency (Craft 5.10.8 and
svg-sanitize 0.22 was the first case); such a package gets its own security PR from the next alert.
Composer 2.9+ also refuses to resolve a lock that keeps any package with a known advisory, which on a
site that is behind blocks every update except the one that fixes that package. The runner therefore
sets `COMPOSER_POLICY_ADVISORIES_BLOCK=0` for its Composer runs: Renovate makes the incremental
update, the vulnerable package gets its own security PR, and verify gates both.

Other settings: `rangeStrategy: update-lockfile` so an exact pin like `"3.1.47"` is replaced and a
caret range keeps its range with the lock updated; a Dependency Dashboard issue per site; at most
six open PRs at once (security PRs count towards it, so three is too few); label `renovate`.

Version lookups go to Packagist only (the first package rule). The Craft starter project lists
`composer.craftcms.com` in `composer.json` as a non-canonical mirror; Composer then also asks Packagist,
but Renovate takes the first registry that answers and ignores `canonical: false`. The mirror serves
stale version lists for third-party packages (found 3 Nov 2026: `yiisoft/yii2-shell` stopped at 2.0.5,
`vlucas/phpdotenv` at 5.6.1, `yiisoft/yii2-redis` at 2.0.18), so without the rule those packages
never get a PR, security fixes included.

Lock updates run with Composer's `--with-dependencies` (Renovate's default), so the packages that an
updated package depends on may move too. A package outside that tree stays locked, and when it pins a
shared dependency the whole group's lock update fails and the PR changes only `composer.json`. First
seen 1 Nov 2026: `craftcms/generator` 2.2.0 needs `nikic/php-parser` ^5, held at 4.x by the locked
`psy/psysh` 0.11, which the locked `yiisoft/yii2-shell` 2.0.5 keeps below 0.12. The way out is the
update of the pinning package (here `yii2-shell` 2.0.6, a patch), after which the group's PR is rebased
and resolves.

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

Secret `RENOVATE_TOKEN` in the `renovate` environment. During the pilot it is a classic personal access
token of Svale's with the `repo` and `workflow` scopes, expiry 90 days (Feedsystem does not allow a
fine-grained token, which would have been limited to the pilot repo). A classic token reaches every
repository the account can, in both organizations, so:

- it lives only in the `renovate` environment here, which is limited to protected branches, and
- as `RENOVATE_PUSH_TOKEN` on each pilot site repo for craft-ci's project config commit, where anyone
  with write access to that repo could read it through a workflow, and
- it is replaced by a GitHub App as soon as the organization admins have created one; `config.js`
  then switches to app credentials and the site secret becomes an App installation token.

Once the App exists, the token is revoked. If a fine-grained token becomes possible first, it needs:
Contents, Pull requests, Issues, Workflows and Commit statuses (read and write), Dependabot alerts and
Metadata (read), and organization Members (read).
