---
description: Explain how to do a release of maxGraph.
---

# Release how-to

This page explains how to release a new version of `@maxgraph/core`.

The release process is partially automated with GitHub Actions, but initialization steps (version updates, tagging) are manual. Further automation is tracked in [#664](https://github.com/maxGraph/maxGraph/issues/664).

## Prerequisites

- Releases are done from the default branch
- Ensure that all GitHub Actions runs are successful
- Make sure that the documentation is up-to-date

## Preparation

Decide on the new version depending on the type of changes:
- Follow [semver](https://semver.org/)
- Check the new commits since the latest release to determine the types of changes included in the new version. This can be done by:
    - running locally `git log --oneline <latest-release-tag>..HEAD` or by automatically retrieving the latest tag:
      ```bash
      LATEST_TAG=$(git describe --tags --abbrev=0)
      git log --oneline ${LATEST_TAG}..HEAD
      ```
    - going to the [latest GitHub release page](https://github.com/maxGraph/maxGraph/releases/latest) and checking the commits since this release (a link is available just above the release title).
- Until we release the first major version, bump the minor version if the release contains new features or breaking changes.

### Milestone management

Check the milestone associated with the new release. **Note:** We always put issues related to a version into a Milestone whose
name matches the version.
- Make sure that the name of the milestone used for the new release version matches the name of the version being
released. Rename it if necessary.
- Verify that all issues related to the upcoming release are attached to the milestone. In particular, check the issues that
[do not have a milestone](https://github.com/maxGraph/maxGraph/issues?q=is%3Aissue+is%3Aclosed+no%3Amilestone).
- Clean up this open milestone if some issues are still open (move them to a new milestone or discard the milestone from them).
- Close the milestone.

### Release notes preparation

Prepare the release notes **before** running the tag and npm publish operations, so you can publish them quickly once the release resources (npm package, examples and website assets) are available.

Release notes are documented in two places: the `CHANGELOG.md` file in the repository and the GitHub release page (the latter is initialized from a template by a GitHub Actions workflow). The minimum you must determine at this stage is the **one-line summary** that broadly describes the changes in the release: it is reused both in the `CHANGELOG.md` entry and on the GitHub release page.

The detailed release notes published on the GitHub release can be prepared with the `prepare-release-notes` Claude Code skill (`.claude/skills/prepare-release-notes`). Invoke it with `/prepare-release-notes`.

It analyzes the commits since the previous release (and their linked pull requests) to draft the breaking changes, deprecation notices and feature highlights, cross-checks that every breaking change and deprecation is recorded in the `CHANGELOG.md`, drafts the one-line summary, and computes the example bundle size table (current version, plus the previous version for comparison). It can also update the GitHub draft release while preserving the auto-generated `Resources` section and the entries below it.

The skill is used in two phases:
- **Now, to prepare the content**: run it during this preparation step to draft the release notes body and the one-line summary. Reuse that summary for the `CHANGELOG.md` entry (see [Apply changes in the source code](#apply-changes-in-the-source-code)). At this stage the GitHub draft release does not exist yet, so let the skill write the draft to a local file.
- **Later, to finalize the GitHub release**: once the tag is pushed and the npm package is published, the draft GitHub release exists, so the skill can update it in place while preserving the auto-generated `Resources` section (see [Finalize the GitHub release](#finalize-the-github-release)).

### Apply changes in the source code

- Prerequisites:
  - Releases are done from the default branch, so all changes are done in the `main` branch.
  - These changes are going to be done locally and then pushed to the repository.
  - Make sure that the code is up to date with the `main` branch. Run `git pull` to get the latest changes.
- Update the version in various files by running, from the repository root: `node scripts/update-versions.mjs <version>` (replace `<version>` with the new version).
- Update the `CHANGELOG.md` file to document the changes in the new version:
  - Add a short sentence describing the main changes. Reuse the one-line summary drafted during [Release notes preparation](#release-notes-preparation).
  - Include all breaking changes (if any). These are typically listed under a "Breaking Changes" section when PRs were merged. The `prepare-release-notes` skill cross-checks that every breaking change and deprecation notice is present here, so use its output to spot missing entries. Review and reorganize as needed.
  - Add a link to the future GitHub release, as shown below:
```
For more details, see the [0.1.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.1.0) on the GitHub release page.
```

- Make a single commit that includes the changes described above
  - Use the following template for the commit message: `chore(release): prepare version 0.2.0`
- Push the changes
  - The default branch is protected by a GitHub ruleset that prevents direct pushing to the branch.
  - Update the ruleset and add a [bypass permission](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#granting-bypass-permissions-for-your-ruleset) for your account.
  - Run the git push command.
  - Update the ruleset to remove the bypass permission. 

- Create a git-annotated tag, prefixing the version with a `v`. For example, if the version is 0.2.0, run:
```
git fetch --tags
git tag -a v0.2.0 -m "chore: release version 0.2.0"
```
- Push the tag
  - As for the default branch, tags are protected by a GitHub ruleset that prevents direct pushing tags.
  - Update the ruleset and add a [bypass permission](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#granting-bypass-permissions-for-your-ruleset) for your account.
  - Run the git tag push, for example `git push origin v0.2.0`
  - Update the ruleset to remove the bypass permission.


## Publish the npm package

The package is published automatically once the Git tag is pushed thanks to a [GitHub workflow](https://github.com/maxGraph/maxgraph-integration-examples/actions/workflows/publish-npm-package.yml).

If its execution fails, and you want to publish the package manually:
- Checkout the tag that has just been created
- From packages/core:
  - run `npm publish`


## Finalize the GitHub release

The release workflow has initiated a new draft GitHub release, which needs to be updated and published.
For more details about GitHub release, follow the [GitHub help](https://help.github.com/en/github/administering-a-repository/managing-releases-in-a-repository#creating-a-release)

This new draft release includes a template to guide the writing of the content, so update the content accordingly to the
changes included in the new version.

The list of the major changes has been [automatically generated](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes). Review and adjust it if necessary:
  - It is based on the labels of the merged Pull Requests included in this release and the [GitHub release configuration](https://github.com/maxGraph/maxGraph/blob/development/.github/release.yml).
  - If the list is incorrect (for example, an item is not in the correct category), update the label(s) or the associated
Pull Request and regenerate the list.

The GitHub workflow automatically attaches the examples and website zip files to the release as assets, so check that they are present.

The draft release already exists at this point, so it is time to update its content with what you prepared during the [Release notes preparation](#release-notes-preparation) phase.
Replace everything above the `Resources` section (summary, breaking changes, highlights and the bundle size tables), and keep `Resources` and the automatically generated list below it.
Also, keep the release date already present on the first line of the draft, which the workflow set to the actual release date.

If you used the `prepare-release-notes` skill, run `/prepare-release-notes` to apply this update automatically.

Before you publish the release, make sure that a discussion will be created in the `Announces` category when the release
is published, by ticking the corresponding checkbox.

Publish the release.

Review the newly created discussion in the [Announces](https://github.com/maxGraph/maxGraph/discussions/categories/announces) category:
- adjust the title
- pin the discussion and unpin the previous release announce
- see for example the [maxGraph 0.1.0 release announce](https://github.com/maxGraph/maxGraph/discussions/147).
