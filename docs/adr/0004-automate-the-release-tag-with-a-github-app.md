# ADR 0004: Automate the release tag with a GitHub App

- **Status**: Proposed
- **Date**: 2026-11-24
- **Scope**: the release process, `.github/workflows/`, the tag rulesets and the Actions policies of the repository,
  the organization secrets and variables,
  `scripts/update-versions.mjs`, the [release how-to](../../packages/website/docs/development/release.md) and the
  `prepare-release` skill
- **Analysis basis**: commit `032365667d5670ceb31728aa2800c4e9134aa706`, after version 0.25.2
- **Related**: [analysis 004](../analyses/004-automate-release-tagging.md), which holds the evidence and the details
  of every option, [issue #664](https://github.com/maxGraph/maxGraph/issues/664)

## Context

The end of a release is manual. A maintainer runs `update-versions.mjs`, commits the version change together with the
changelog and the bundle size files, pushes that commit directly to `main`, then creates and pushes a signed annotated
tag. Both pushes are blocked by rulesets, so the maintainer adds a bypass for their account, pushes, and removes it.
Editing a ruleset needs the admin role, which limits the number of people able to release, and every manual step is a
chance for a mistake.

The tag push starts the rest: `publish-npm-package.yml` publishes the package with npm trusted publishing, and
`create-github-release.yml` creates the draft GitHub release from the tag. Both trigger on `push: tags: v*`.

Four constraints shape the solution:

- **A tag created with the `GITHUB_TOKEN` starts no workflow.** The two release workflows would not run. The
  `GITHUB_TOKEN` cannot create the tag anyway: the `tags - creation` ruleset blocks every tag creation, and GitHub
  refuses the GitHub Actions integration as a bypass actor (reported by a third party, not tested here).
- **The release commit must be signed.** Squash merges of pull requests are signed by GitHub. A commit pushed by a
  workflow with `git push` is not.
- **A GitHub App cannot get a "Verified" signature on a tag.** GitHub signs commits created through its API, not tag
  objects, and a key of the bot cannot be registered on an account.
- **By default, any user with write access can run a `workflow_dispatch` workflow**, and can read a repository secret
  by running a modified workflow from a branch. GitHub environments restrict which branch gets a secret, not who
  launches a run, and exist only per repository. The workflow execution protections of Actions, generally available
  since September 2026, restrict the launch by repository role.

## Decision

**The release is split in three phases, and only the creation of the tag is automated.**

1. **Preparation, through a regular pull request.** Milestones and issues, release notes content, version choice,
   `CHANGELOG.md`, bundle size history, size budgets, **and the output of `update-versions.mjs`**. The squash merge of
   that pull request is the release commit, signed by GitHub.
2. **Publication, through a `workflow_dispatch` workflow** taking the version as input. It checks that the head of
   `main` is the preparation commit and holds that version, that the changelog has its entry and that the tag does not
   exist, then creates a **lightweight tag** `v<version>` on that commit through the REST API, with an installation
   token of a **GitHub App**. The existing tag workflows then publish the package and create the draft release,
   unchanged.
3. **Finalization**: the GitHub release notes are completed as today.

**The App is a bypass actor of the `tags - creation` ruleset only**, never of the rulesets of `main`: the workflow
writes nothing to the branch. The rules forbidding to delete, move or force-push a tag live in a separate
`tags - general` ruleset without any bypass, so the App can create a tag and nothing else.

**The launch is restricted to the Maintain and Admin roles** by a workflow execution protection of the repository
(Settings, Actions, Policies), allowing `workflow_dispatch` on the release workflow to these two roles only. GitHub
enforces it before the run starts, so editing the workflow on a branch does not bypass it.

**The App ID and private key are an organization variable and secret**, whose access policy lists this repository and
the playground repository where the setup is tested first. A single copy serves both, and the App is installed on these
two repositories only.

## Alternatives considered

- **Bump the version in the workflow, with a commit of its own on `main`.** It would separate the documentation (the
  pull request) from the release act (the commit), and keep `package.json` from announcing an unpublished version.
  Rejected: the pull request already declares the release through its changelog heading, so `main` would contradict
  itself between the merge and the workflow run; the version change would skip review; the App would need a permanent
  bypass of the pull request rule of `main`, letting whoever holds its key push anything there; and keeping that commit
  signed would require creating it through the GitHub API, either with the GraphQL `createCommitOnBranch` mutation or
  with the `planetscale/ghcommit-action` action wrapping it, the more readable of the two, both with the limits of
  that mutation.
- **`GITHUB_TOKEN` plus an explicit `workflow_dispatch` of the release workflows.** No secret to manage, but the token
  cannot create the tag under the tag rulesets, and the release workflows would stop reacting to a tag pushed by
  hand, the fallback when the automation fails.
- **A tag signed with a key of the App.** Signed, but displayed "Unverified", for one more secret.
- **A machine user with a personal access token and a GPG key.** The only way to keep a "Verified" tag, at the cost of
  an extra account to secure, a token to rotate and a key to manage. The `bot` team in the bypass lists is meant for
  such accounts, should this be reconsidered.
- **The App key as a secret of a `release` environment restricted to `main`.** It would keep the key away from
  workflows run on other branches, but environments are per repository, so the key would be copied into each
  repository using the App, the playground included.
- **Required reviewers on an environment, to restrict the launch.** An approval gate rather than a restriction: a
  committer can start a run that waits for a maintainer, and a maintainer releasing alone approves their own run, a
  click that brings nothing once the launch is restricted.
- **A role check written in the workflow**, reading `role_name` through the collaborator permission endpoint. It lives
  in the workflow, so a copy on a branch can drop it.
- **A tool handling the whole release.** Out of scope: only the part that is still manual is automated, as stated in
  issue #664.

## Consequences

### Positive

- Any maintainer can release, without the admin role and without editing a ruleset.
- The release commit is reviewed, built by the CI with its final version, and signed by GitHub.
- The App holds a narrow permission: create tags. It can neither delete nor move one, nor write to `main`.
- The tag workflows do not change, and a tag pushed by hand still starts them.

### Negative

- **The tag is no longer signed.** Today the tags are annotated, signed and "Verified". The trust now rests on the
  target commit only. Issue #664 says the tag should be signed: this is accepted as a step back.
- **`main` announces the new version before it is published**, from the merge of the preparation pull request until
  the workflow runs. The website deployed from `main` shows it too. Running phase 2 right after the merge keeps the
  window short.
- **The release date of the changelog is set in the pull request**, so it is wrong if phase 2 slips to another day.
- **The App private key becomes a secret to protect and rotate.**
- **The App key is readable from any branch of the selected repositories.** An organization secret cannot be bound to
  a branch, so any user able to push a branch there can read the key, tag any commit and get it published to npm. It
  holds because, on 2026-11-24, every collaborator of the repository has the Maintain or Admin role. Granting the
  Write role to someone, here or on the playground, reopens this decision. The "scoped secrets" announced by GitHub on
  2026-03-26, not released yet, would bind the secret to `main` and to the release workflow.
- **A tag cannot be undone.** A tag created on the wrong commit, or one whose push started no workflow, stays: nobody
  can delete it, short of an admin editing `tags - general`. The workflow validates the commit before tagging, and the
  tag creation is tested in the playground repository before the first release.
- **The workflow refuses to tag if another pull request was merged after the preparation one**, to avoid tagging the
  wrong commit. The maintainer then has to tag a given commit, through an optional input of the workflow or by hand.

## Validation before acceptance

The decision relies on a tag created with `POST /git/refs` and an App installation token starting the `on: push: tags`
workflows. This was observed in a public repository for a tag created through the release endpoint with an App token,
not for `POST /git/refs` itself, see the analysis. It will be tested in a playground repository of the `maxGraph`
organization before this ADR is accepted. Should it fail, the workflow pushes the lightweight tag with `git push` and
the App token instead, which is known to start workflows, and the decision stands otherwise.
