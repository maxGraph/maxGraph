# Analysis 004: Automate the creation of the release tag

- **Date**: 2026-11-24
- **Written with**: Claude Code (Claude Opus 5.5)
- **Analysis basis**: commit `032365667d5670ceb31728aa2800c4e9134aa706` on `main`, after version 0.25.2. File
  references point to that commit. The repository settings (rulesets, environments) were read
  through the GitHub API on the same day, with an account having the admin role on the repository
- **Question**: how can the manual part of a release (version update, commit, tag) be automated, so that it no longer
  needs a repository administrator, while keeping the release commit signed and the tag triggering the existing release
  workflows?
- **Related**: [ADR 0004](../adr/0004-automate-the-release-tag-with-a-github-app.md),
  [issue #664](https://github.com/maxGraph/maxGraph/issues/664), the
  [objective stated for the first release](https://github.com/maxGraph/maxGraph/issues/141#issuecomment-1323392317),
  [PR #650](https://github.com/maxGraph/maxGraph/pull/650) (`scripts/update-versions.mjs`), the
  [release how-to](../../packages/website/docs/development/release.md)

## Summary

| Option for creating the tag | Triggers the tag workflows | Tag signature | Ruleset bypass needed | Secrets |
|---|---|---|---|---|
| A. `GITHUB_TOKEN`, then explicit `workflow_dispatch` | no, both workflows must be dispatched | none | reported impossible, see [Option A](#option-a-github_token-and-explicit-dispatch) | none |
| **B. GitHub App token, lightweight tag through the REST API** | yes | none, the target commit is "Verified" | App on the `tags` ruleset | App private key |
| C. GitHub App token, tag signed with a key of the bot | yes | signed, shown "Unverified" | App on the `tags` ruleset | App private key, GPG or SSH key |
| D. Machine user with a PAT and a GPG key | yes | signed, "Verified" | user on the `tags` ruleset | PAT to rotate, GPG key, an extra account |

Recommendation: **option B**, with the version bump done in the preparation pull request rather than by the workflow,
so that the workflow only creates a tag and never writes to `main`. The launch is restricted to the Maintain and Admin
roles by a workflow execution protection of the repository. The App ID and private key are an organization variable
and secret, shared with the playground repository used to test the setup. The one loss compared with today is the
signature of the tag itself, see [What is lost: the tag signature](#what-is-lost-the-tag-signature).

## Current process

The release how-to describes it. After the preparation (milestones, version choice, release notes, `CHANGELOG.md`,
bundle size history and size budgets, done with the `prepare-release` skill), a maintainer:

1. runs `node scripts/update-versions.mjs <version>`, which updates `packages/core/package.json`, the entry of
   `packages/core` in `package-lock.json`, and the `VERSION` constant of `packages/core/src/util/Constants.ts`,
2. makes a single commit `chore(release): prepare version <version>` with all the changes above,
3. adds a bypass for their account to the `default branch - require PR` ruleset, pushes to `main`, removes the bypass,
4. creates an annotated tag `v<version>`, adds a bypass to the `tags` ruleset, pushes the tag, removes the bypass.

Editing a ruleset needs the admin role, which is what limits the number of people able to release.

The tag push starts two workflows, both on `push: tags: v*`:

- `.github/workflows/publish-npm-package.yml` publishes `@maxgraph/core` with npm trusted publishing (no token),
- `.github/workflows/create-github-release.yml` builds the examples and the website, then creates the **draft** GitHub
  release from the existing tag, with `ncipollo/release-action`. It does not create the tag.

The maintainer then finishes the GitHub release notes by hand or with the `prepare-release` skill.

Signatures today, read through the API:

| Object | Signed by | Verification |
|---|---|---|
| Release commits `bd728a2af` (0.25.2), `8fa78c2f2` (0.25.1) | the maintainer | `valid`, "Verified" |
| Annotated tags `v0.25.2`, `v0.25.1` | the maintainer | `valid`, "Verified" |
| Squash merges of pull requests, for instance `032365667` | GitHub (`web-flow`) | `valid`, "Verified" |

## Target process

| Phase | What | How |
|---|---|---|
| 1. Preparation | issues and milestones, punch line, release notes content, version choice, `CHANGELOG.md`, bundle size history, size budgets, **and the output of `update-versions.mjs`** | a regular pull request, reviewed and squash merged as usual |
| 2. Publication | create the tag `v<version>`, which starts the npm publication and the draft GitHub release | a new `workflow_dispatch` workflow, launched by a maintainer with the version as input |
| 3. Finalization | finish and publish the GitHub release notes | by hand or with the `prepare-release` skill, unchanged |

The changelog preparation stays manual, and the release mechanism is not replaced by a dedicated tool, as stated in
issue #664.

## Repository state relevant to the automation

### Rulesets

| Ruleset | Target | Rules | Bypass |
|---|---|---|---|
| `default branch - general` | `main` | no deletion, no force push | none |
| `default branch - require PR` | `main` | pull request required, squash merge only | team `bot`, always |
| `tags` | every tag (`~ALL`) | no creation, no update, no deletion, no force push | team `bot`, always |
| `Code Quality Copilot review for default branch` | `main` | disabled | none |

- No ruleset requires signed commits. The signature of the release commit is a project policy stated in issue #664,
  not something GitHub enforces.
- The `bot` team is meant for machine accounts. A GitHub App cannot be a team member, so an App has to be added to a
  bypass list as an actor of its own.
- The bypass lists are returned by the API only to an account with the admin role. With the maintain role,
  `bypass_actors` is `null`, which reads as "no bypass" although there is one.

### Other settings

- The default permission of the `GITHUB_TOKEN` is `read`, so every workflow declares its own permissions, as the
  existing ones already do.
- The `github-pages` environment is used by `generate-website.yml`.
- No GitHub App is dedicated to the release. It has to be created.

## Where the version bump goes

Two places were considered for the output of `update-versions.mjs`.

**In the workflow**, as issue #664 first described it: the preparation pull request holds the documentation, and the
workflow commits the version change directly to `main`, then tags that commit. The release act is then a commit of its
own, entirely generated, which `git show v<version>` shows alone, and `package.json` never announces an unpublished
version.

**In the preparation pull request**, retained:

- The pull request is not documentation only. Its `CHANGELOG.md` heading already declares the release of the version,
  and it tightens the size budgets in the configuration of the examples. The bump only copies the version already
  decided into two more files.
- With the bump in the workflow, `main` contradicts itself between the merge and the workflow run: the changelog says
  the version is released while `package.json` and `Constants.ts` carry the previous one. With the bump in the pull
  request, everything says the new version, and only the tag is missing.
- The release stays a single reviewed commit, as today, and the CI of the pull request builds and checks the npm
  package with the final version.
- The workflow never writes to `main`, so the App needs no bypass of `default branch - require PR`. A permanent bypass
  would let whoever obtains the App key push anything to `main` without a pull request, a much wider permission than
  creating a tag.
- The release commit is the squash merge, already signed by GitHub. Creating a signed commit from the workflow would
  need the GraphQL `createCommitOnBranch` mutation (a commit pushed with `git push` and an App token is unsigned), with
  its limits: no file mode change, no symlink, and a failure when `main` moved since the checkout.

Consequences to handle:

- Between the merge and the workflow run, `main` announces a version that is not published. `generate-website.yml`
  deploys the website on every push to `main` touching `packages/core`, so the website shows the new version before the
  npm package exists. This lasts until phase 2 runs, which is expected to follow the merge immediately.
- Another pull request may be merged between the preparation pull request and the workflow run. The workflow must tag
  the preparation commit, not the head of `main` blindly, see [Workflow outline](#workflow-outline).
- The release date written in `CHANGELOG.md` is set in the pull request, so it is wrong if phase 2 is delayed to
  another day. The manual process has the same limit.

## Creating a tag that triggers the release workflows

### The `GITHUB_TOKEN` does not trigger workflows on push

Events created with the `GITHUB_TOKEN` do not start new workflow runs, to prevent loops, see
[Triggering a workflow from a workflow](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
Two exceptions were added since: `workflow_dispatch` and `repository_dispatch` events
([changelog of 2022-09-08](https://github.blog/changelog/2022-09-08-github-actions-use-github_token-with-workflow_dispatch-and-repository_dispatch/)),
and pull requests created or updated by the token, whose runs wait for an approval
([changelog of 2026-06-11](https://github.blog/changelog/2026-06-11-bot-created-pull-requests-can-run-workflows-if-approved/)).
Nothing changed for pushes and tags: a tag created with the `GITHUB_TOKEN` starts neither
`publish-npm-package.yml` nor `create-github-release.yml`.

A GitHub App installation token or a personal access token does trigger them.

### Option A: `GITHUB_TOKEN` and explicit dispatch

The workflow creates the tag with the `GITHUB_TOKEN`, then runs `gh workflow run` on the two release workflows, which
need a `workflow_dispatch` trigger and must read the version from an input instead of `GITHUB_REF_NAME`.

- It needs no secret, but changes both release workflows.
- The `tags` ruleset blocks tag creation for everybody outside its bypass list, and the GitHub Actions integration
  cannot be added to that list: GitHub answers `Actor GitHub Actions integration must be part of the ruleset source or
  owner organization`, as reported in
  [artifact-keeper/artifact-keeper#4071](https://github.com/artifact-keeper/artifact-keeper/issues/4071), not tested
  here. Even if it could, the bypass would cover every workflow of the repository holding `contents: write`, including
  one modified on a branch by any committer.

Rejected: the `GITHUB_TOKEN` cannot create the tag under the current `tags` ruleset, and the release workflows would no
longer react to a tag pushed by hand, which is the fallback when the automation fails.

### Option B: GitHub App token, lightweight tag

The workflow gets an installation token of the App with `actions/create-github-app-token`, then creates the ref:

```bash
gh api "repos/${GITHUB_REPOSITORY}/git/refs" -f ref="refs/tags/v${VERSION}" -f sha="${RELEASE_COMMIT_SHA}"
```

- The tag push starts the two existing workflows unchanged, and the GitHub release is still created by
  `create-github-release.yml` from the tag. No `gh release create` is involved.
- The App needs `contents: write` and a place in the bypass list of the `tags` ruleset only.
- The tag is created by the bot user of the App, `<app-slug>[bot]`. There is nothing to configure: a GitHub App has no
  author or committer setting, its identity derives from its name.

#### Does a tag created through the API start the tag workflows?

This is the condition of the whole option: if a tag created through the REST API with an App token did not start
`on: push: tags` workflows, option B would be eliminated. No GitHub documentation states it for `POST /git/refs`
specifically. The documented rule is that only events created by the `GITHUB_TOKEN` are excluded, and observed
behaviour in other repositories agrees:

- **Tag created through the REST API with an App token, workflow started.** In `cloudquery/cloudquery`, the
  [`release_pr.yml`](https://github.com/cloudquery/cloudquery/blob/42276c7734daa1788c55746a9e311d13727398ba/.github/workflows/release_pr.yml#L20-L31)
  workflow runs `release-please-action` with an installation token of their App. release-please creates the tag server
  side, through the release creation endpoint
  ([`repos.createRelease` with `tag_name` and `target_commitish`](https://github.com/googleapis/release-please/blob/6118ca3dab83e5b27643da3fbe7bc9ad6fadf7dd/src/github-api.ts#L700-L709)),
  without any git push. The release `cli-v6.51.1` was published by `cloudquery-ci[bot]` at 2026-11-16 12:53:19 UTC,
  and two seconds later the
  [`release-cli` run](https://github.com/cloudquery/cloudquery/actions/runs/43870634011), whose workflow
  [triggers on `push: tags: cli-v*.*.*`](https://github.com/cloudquery/cloudquery/blob/42276c7734daa1788c55746a9e311d13727398ba/.github/workflows/release_cli.yml#L1-L5),
  started on that tag with `cloudquery-ci[bot]` as actor.
- **The same repository creates other tags with `POST /git/refs` and an App token**, in
  [`push_tags.yml`](https://github.com/cloudquery/cloudquery/blob/42276c7734daa1788c55746a9e311d13727398ba/.github/workflows/push_tags.yml#L28-L45),
  as do `wasm-bindgen/wasm-bindgen` and `grafana/grafana`. No run triggered by such a tag could be matched with its
  creation: the attempt found in `wasm-bindgen` failed and its tag was then pushed by a maintainer.
- **Tag pushed with `git push` and an App token, workflow started**: the fix merged in
  [camunda/connectors#6922](https://github.com/camunda/connectors/pull/6922), after a release tag pushed with the
  `GITHUB_TOKEN` had skipped a downstream workflow.
- One contrary statement was found: a design note in
  [artifact-keeper/artifact-keeper#4071](https://github.com/artifact-keeper/artifact-keeper/issues/4071) asserts that a
  ref created with `POST /git/refs` and an App token "fires none". It is an aside without a test or a run to support
  it, and the `cloudquery` run above contradicts it for a tag created server side by an App token.

Conclusion: a tag created through the REST API with an App token starts the tag workflows, observed on the release
endpoint and expected for `POST /git/refs`, which creates the same ref through the same token. The residual doubt on
that exact endpoint does not threaten the option: if it ever failed, the workflow can push the lightweight tag with
`git push` and the App token instead, the pattern observed in `camunda/connectors`. Nothing else in the option changes,
since a lightweight tag carries no signature either way.

#### Annotated tag

An annotated tag is also possible through the API (`POST /git/tags`, then `POST /git/refs`). It adds a message and a
tagger, but GitHub does not sign tag objects created through the API, as far as could be found, so it brings nothing
over a lightweight tag for trust.

### Option C: GitHub App token, tag signed with a key of the bot

A GPG or SSH key stored as a secret lets the workflow run `git tag -s`. The tag is cryptographically signed and can be
checked locally with `git tag -v` once the public key is published. GitHub shows it "Unverified" anyway: the badge
requires the key to be registered on an account with a verified email matching the tagger, and a GitHub App bot has no
account where a key can be registered. A second secret for a signature nobody sees as valid.

### Option D: machine user

An account added to the `bot` team, with a personal access token and a GPG key registered on its profile, gives a
"Verified" signed tag, as today. It costs an extra account to secure, a token to rotate, and a key to manage, for the
tag signature only.

## What is lost: the tag signature

Today the tags are annotated, signed by the maintainer and "Verified". With option B the tag is a lightweight ref,
without signature. The trust moves entirely to the target commit, which is the squash merge of the preparation pull
request, signed by GitHub and "Verified". Issue #664 states that the tag SHOULD be signed, so this is a deliberate step
back, accepted because only option D avoids it, at a cost out of proportion with the gain.

## Restricting the launch to the Maintain role

By default any user with write access can run a `workflow_dispatch` workflow. Two problems have to be solved: who may
launch the release, and who may get the App private key.

### Who may launch: a workflow execution protection

GitHub added **workflow execution protections** to Actions, announced in public preview on
[2026-06-18](https://github.blog/changelog/2026-06-18-control-who-and-what-triggers-github-actions-workflows/) and
[generally available since 2026-09-17](https://github.blog/changelog/2026-09-17-workflow-execution-protections-in-github-actions-generally-available)
for GitHub Enterprise, organizations and repositories. They
are allowlists built on the rulesets framework, configured under Settings, Actions, Policies, at the enterprise,
organization or repository level, see
[About Actions policies](https://docs.github.com/en/actions/concepts/about-actions-policies) and
[Control workflow execution](https://docs.github.com/en/actions/how-tos/administer/control-workflow-execution):

- an **actor rule** lists who may trigger workflows: individual users, repository roles (`Read`, `Maintain`, `Admin`),
  GitHub Apps, Copilot, Dependabot;
- an **event rule** lists the events allowed to start them, such as `workflow_dispatch`;
- a policy can target **specific workflow paths**, so it can cover the release workflow alone;
- a disallowed run fails with an error such as `Event 'workflow_dispatch' is not allowed to trigger Actions
  workflows`, and an **Evaluate** mode reports what would be blocked without enforcing it.

The Policies section is available on `maxGraph/maxGraph`, checked in the repository settings on 2026-11-24. Repository
administrators can set a policy there.

A policy targeting the release workflow, allowing `workflow_dispatch` to the `Maintain` and `Admin` roles, is the launch
restriction. It is enforced by GitHub before the workflow runs, so it cannot be removed by editing the workflow on a
branch, unlike a check written in the workflow.

The documentation does not say whether a re-run is checked against the user who re-runs it.

### Where the App credentials live: organization secret and variable

The App ID and the App private key are needed by this repository and by a playground repository of the organization,
where the tag creation is tested first. To keep a single copy of each, they are an **organization variable** and an
**organization secret**, whose access policy lists these two repositories only, see
[Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets).

A `release` environment would have been the usual place for the key, since an environment secret is given only to the
jobs targeting the environment, and a deployment branch policy can restrict that to `main`. But environments exist only
per repository, so sharing the key that way means one copy per repository. No organization-level environment was found
in the GitHub documentation.

The price is the branch restriction. An organization secret cannot be limited to a branch or an environment: it is
given to every workflow run of the selected repositories, except those of pull requests from forks. Any user able to
push a branch to one of these repositories can add a workflow that reads the key, under a file name no execution
protection targets. With the key, they can mint an App token, create a `v*` tag on any commit, including one of their
branch, and so publish that commit to npm through `publish-npm-package.yml`.

This is acceptable as long as the users who can push to these repositories are the users trusted to release:

- on 2026-11-24, `maxGraph/maxGraph` has 3 collaborators with the Admin role and 3 with the Maintain role, and none
  with the Write role alone. Granting the Write role to someone gives them the key, so it reopens this decision;
- the playground repository must keep the same restriction, since its writers get the same key, and the App installed
  on both repositories can tag either of them.

The "scoped secrets" announced on 2026-03-26 in the
[GitHub Actions 2026 security roadmap](https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/)
would remove the trade-off: they bind a secret to repositories, branches or environments, and workflow paths. The
roadmap targeted a public preview within 3 to 6 months and general availability within 6 months, so by September 2026.
No release of the feature was found on 2026-11-24; once available, the organization secret should be bound to `main`
and to the release workflow.

The environment brings no role restriction of its own anyway: its secrets, variables and protection rules apply to the
jobs targeting it, whoever launched them.

### Alternatives rejected for the launch restriction

- **Required reviewers on the environment.** Up to six users or teams, here `repo-maintainers` and `repo-admins`, one
  of whom approves the job before it runs. This is an approval gate, not a launch restriction: a committer can start a
  run, which waits until a maintainer approves it. With the "Prevent self-review" option the person who launched the run
  cannot approve it, so a maintainer releasing alone needs it off and approves their own run, a click that brings
  nothing once the policy restricts the launch.
- **A role check in the workflow**, reading `role_name` from
  `GET /repos/{owner}/{repo}/collaborators/{username}/permission` for `github.triggering_actor`, and failing unless it
  is `maintain` or `admin`. It works with the `GITHUB_TOKEN`, but lives in the workflow, so a committer can remove it
  from a copy on a branch. `gh` has no command for it. Marketplace actions exist, but the one checked,
  `prince-chrismc/check-actor-permissions-action`, compares the legacy `permission` field (`none`, `read`, `write`,
  `admin`), in which the Maintain role reads as `write`, so it cannot tell a maintainer from a committer.

## Workflow outline

Trigger `workflow_dispatch`, input `version` (for instance `0.26.0`, without the `v` prefix).

Before it starts, the workflow execution protection rejects a launch by a user without the Maintain or Admin role.

1. **One job**, reading the App ID and private key from the organization variable and secret:
   1. check out `main`,
   2. validate the input format,
   3. check that the head of `main` is the preparation commit: its subject starts with
      `chore(release): prepare version <version>`, otherwise fail, so that a pull request merged in between is never
      tagged by mistake,
   4. check that `packages/core/package.json` holds the version given as input, which turns the input into a
      confirmation that a typo makes fail,
   5. check that `CHANGELOG.md` has a `## <version>` heading and that the tag `v<version>` does not exist,
   6. get the App installation token with `actions/create-github-app-token`,
   7. create `refs/tags/v<version>` on the preparation commit through the REST API.

No loop guard is needed: the workflow is launched by hand and creates no commit.

A stricter variant takes an optional `sha` input, defaulting to the head of `main`, and runs the same checks on that
commit, for the case where something was merged after the preparation pull request.

## Risks and points to verify

- **The tag created through the API triggers `on: push: tags`.** Observed in another repository for a tag created
  server side with an App token, not observed for `POST /git/refs` itself, see
  [Does a tag created through the API start the tag workflows?](#does-a-tag-created-through-the-api-start-the-tag-workflows).
  The first real release shows it: if no publication starts within a minute, the tag has to be deleted and pushed again
  with `git push` and the App token, since pushing a tag that already exists creates no event. The bypass of the App
  covers the deletion rule of the `tags` ruleset too. The workflow then switches to that method. A test beforehand is
  done in a playground repository of the organization: on this repository, a `v*` tag would start a real npm
  publication.
- **The `tags` ruleset blocks every tag creation.** The App must be in its bypass list, otherwise the API call is
  rejected.
- **The execution protection is new to the repository.** Use its Evaluate mode first to see what it would block.
- **The App key is the sensitive asset.** It grants `contents: write` on the repositories where the App is installed,
  and bypasses the `tags` ruleset. As an organization secret it is readable from any branch of the selected
  repositories, see
  [Where the App credentials live](#where-the-app-credentials-live-organization-secret-and-variable). Keep the App
  installation and the secret access policy limited to this repository and the playground, and the Write role on both
  limited to the users trusted to release.
- **Partial failure.** If the npm publication fails after the tag is created, the fallback of the release how-to still
  applies (manual `npm publish` from the tag). A tag created on the wrong commit cannot be deleted without a bypass of
  the `tags` ruleset, which is why the workflow validates the commit before creating it.

## Recommendation

Implement option B, with the version bump in the preparation pull request, a workflow execution protection allowing
only the Maintain and Admin roles to launch the release workflow, and the App ID and key as an organization variable
and secret restricted to this repository and the playground. Accept the loss of the tag signature, the trust being
carried by the "Verified" release commit.

## Proposed action plan

Each step is useful on its own.

1. Record the decision in an ADR that links to this analysis.
2. Confirm, in a playground repository of the `maxGraph` organization, that a tag created with `POST /git/refs` and an
   App token starts `on: push: tags` workflows.
3. Create the GitHub App with the `contents: write` permission only, install it on this repository and the playground
   only, store its ID and private key as an organization variable and secret restricted to these two repositories, and
   add it to the bypass list of the `tags` ruleset.
4. Add a workflow execution protection allowing `workflow_dispatch` on the release workflow to the `Maintain` and
   `Admin` roles only, first in Evaluate mode.
5. Add the workflow, then enforce the protection.
6. Update the release how-to: run `update-versions.mjs` in the preparation pull request, replace the manual commit,
   tag and ruleset edits by the workflow launch. Fix on the way the link of the npm publication workflow, which points
   to the `maxgraph-integration-examples` repository.
7. Update the `prepare-release` skill, which leaves its changes uncommitted on `main` for the manual release commit, so
   that it prepares a pull request including the version bump instead.
8. Delete the `npm-publish` environment, which no workflow uses and none will.
9. When GitHub ships scoped secrets, bind the organization secret to `main` and to the release workflow.

## Method and limits

- The repository settings were read through the GitHub REST API: rulesets with their bypass lists, environments, the
  verification of the latest tags and release commits. The state of the organization (organization
  rulesets, organization secrets) was not read, it needs the `admin:org` scope.
- The behaviour of GitHub (commits signed when created through the API, no signature for tag objects created through
  the API, events not created by the `GITHUB_TOKEN`) comes from the GitHub documentation and changelogs linked above.
- Whether an API-created tag starts the tag workflows was established from the workflow runs of public repositories,
  read through the GitHub API on 2026-11-24, not by a test on this repository.
- The refusal of the GitHub Actions integration as a ruleset bypass actor is reported by a third party and was not
  reproduced.
- The repository roles were read through the collaborators endpoint on 2026-11-24.
- The workflow execution protections are described from the GitHub changelog and documentation; only the presence of
  the Policies section in the settings of the repository was checked, no policy was created.
- Statements marked "as far as could be found" or "not verified" were not tested.
- Nothing was implemented or tested on the repository for this analysis.
