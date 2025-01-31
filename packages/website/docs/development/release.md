---
description: Explain how to do a release of maxGraph.
---

# Release how-to

This page explains the steps needed to release a new version of maxgraph@core.

Currently, the release process is completely manual. Automation will come later based on the information provided here.

## Prerequisites

- Releases are done from the default branch
- Ensure that all GitHub Actions runs are successful
- Make sure that the documentation is up-to-date

## Preparation

Decide on the new version depending on the type of changes:
- Follow [semver](https://semver.org/)
- Check the new commits since the latest release to determine the type of changes included in the new version. This can be done by:
    - running locally `git log --oneline <latest-release-tag>..HEAD`
    - going the [latest GitHub release page](https://github.com/maxGraph/maxGraph/releases/latest) and checking the commits since this release (a link is available just above the release title).
- Until we release the first major version, bump the minor version if the release contains new features or breaking changes.

Check the milestone associated with the new release. **Note:** We always put issues related to a version into a Milestone whose
name matches the version.
- Make sure that the name of the milestone used for the new release version matches the name of the version being
released. Rename it if necessary.
- Verify that all issues related to the upcoming release are attached to the milestone. In particular, check the issues that
[do not have a milestone](https://github.com/maxGraph/maxGraph/issues?q=is%3Aissue+is%3Aclosed+no%3Amilestone).
- Clean up this open milestone if some issues are still open (move them to a new milestone or discard the milestone from them).
- Close the milestone.

Apply changes in the source code
- Prerequisites:
  - Releases are done from the default branch, so all changes are done in the `main` branch.
  - These changes are going to be done locally, and then pushed to the repository.
  - Make sure that the code is up-to-date with the `main` branch. Run `git pull` to get the latest changes.
- Update the version in various files by running, from the repository root: `node scripts/update-versions.mjs <version>` (replace `<version>` with the new version).
- Update the `CHANGELOG` file to list the major changes included in the new version. Be generic and add a
link to the future GitHub release that will contain detailed release notes, as shown below.
```
For more details, see the [0.1.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.1.0) on
the GitHub release page.
```

- Make a single commit that includes the changes described above
  - Use the following template for the commit message: `chore(release): prepare version 0.2.0`
- Push the changes
  - The default branch is protected by a GitHub ruleset that prevents direct pushing to the branch.
  - Update the ruleset and add a [bypass permission](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#granting-bypass-permissions-for-your-ruleset) for your account.
  - Run the git push command.
  - Update the ruleset to remove the bypass permission. 

- Create a git annotated tag, prefixing the version with a `v`. For example, if the version is 0.2.0, run:
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


## Create the GitHub release

The release workflow has initiated a new draft GitHub release, which needs to be updated and published.
For more details about GitHub release, follow the [GitHub help](https://help.github.com/en/github/administering-a-repository/managing-releases-in-a-repository#creating-a-release)

This new draft release includes a template to guide the writing of the content, so update the content accordingly to the
changes included in the new version.

The list of the major changes has been [automatically generated](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes). Review and adjust it if necessary:
  - It is based on the labels of the merged Pull Requests included in this release and the [GitHub release configuration](https://github.com/maxGraph/maxGraph/blob/development/.github/release.yml).
  - If the list is incorrect (for example, an item is not in the correct category), update the label(s) or the associated
Pull Request and regenerate the list.

Attach the examples and the website to the release (in the "assets" location):
  - Retrieve the artifacts built by GitHub Actions on the commit of the tag
  - examples:
    - location: https://github.com/maxGraph/maxGraph/actions/workflows/build.yml
    - rename the file to: `maxgraph_<version>_website.zip`
  - website:
    - location: https://github.com/maxGraph/maxGraph/actions/workflows/generate-website.yml. The artifact is not available in the summary of the job. Open the log to get the URL of the artifact.
    - rename the file to: `maxgraph_<version>_examples.zip`

Before you publish the release, make sure that a discussion will be created in the `Announces` category when the release
is published.

Publish the release.

Review the newly created discussion in the [Announces](https://github.com/maxGraph/maxGraph/discussions/categories/announces) category:
- adjust the title
- pin the discussion and unpin the previous release announce
- see for example the [maxGraph 0.1.0 release announce](https://github.com/maxGraph/maxGraph/discussions/147).
