---
description: Explain how to do a release of maxGraph.
---

# Release how-to

This page explains the steps needed to release a new version of maxgraph@core.

Currently, the release process is completely manual. Automation will come later based on the information provided here.


## Preparation

Decide on the new version depending on the type of changes:
- Follow [semver](https://semver.org/)
- Until we release the first major version, bump the minor version if the release contains new features or breaking changes.

Check the milestone associated with the new release. **Note:** We always put issues related to a version into a Milestone whose
name matches the version.
- Make sure that the name of the milestone used for the new release version matches the name of the version being
released. Rename it if necessary.
- Verify that all issues related to the upcoming release are attached to the milestone. In particular, check the issues that
[do not have a milestone](https://github.com/maxGraph/maxGraph/issues?q=is%3Aissue+is%3Aclosed+no%3Amilestone).
- Clean up this open milestone if some issues are still open (move them to a new milestone or discard the milestone from them).
- Close the milestone.

Changes in the source code
- Update the version in `packages/core/package.json` and the `VERSION` constant in the `packages/core/src/Client.ts` file.
- Update the `package-lock.json` file by running npm install at the root of the repository. It should only change the version of `@maxgraph/core`.
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

- Create a git tag, prefixing the version with a `v`. For example, if the version is 0.2.0, run:
```
git fetch --tags
git tag v0.2.0
```
- Push the tag
  - As for the default branch, tags are protected by a GitHub ruleset that prevents direct pushing tags.
  - Update the ruleset and add a [bypass permission](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository#granting-bypass-permissions-for-your-ruleset) for your account.
  - Run the git tag push, for example `git push origin v0.2.0`
  - Update the ruleset to remove the bypass permission.


## Publish the npm package

- Checkout the tag that has just been created
- From packages/core:
  - run `npm publish`


## Create the GitHub release

**Example**: Use the [maxGraph 0.1.0 release](https://github.com/maxGraph/maxGraph/releases/tag/v0.1.0) for inspiration

Create a [new draft release](https://github.com/maxGraph/maxGraph/releases/)
- name: use the version that has just been published
- tag: use the tag create before
- save it as a draft

Generate the list of the major changes by using the [automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes).
It is based on the labels of the merged Pull Requests included in this release and the [GitHub release configuration](https://github.com/maxGraph/maxGraph/blob/development/.github/release.yml).

If the list is incorrect (for example, an item is not in the correct category), update the label(s) or the associated
Pull Request and regenerate the list.

On top of the auto-generated list, add a few words to highlight important changes. In particular, list **_breaking changes_**.

Also add links to the
- npm package
- GitHub milestone
- related paragraph in the Changelog file

Before you publish the release, make sure that a discussion will be created in the `Announces` category when the release
is published.

Publish the release.

Review the newly created discussion in the [Announces](https://github.com/maxGraph/maxGraph/discussions/categories/announces) category:
- adjust the title
- pin the discussion and unpin the previous release announce
- see for example the [maxGraph 0.1.0 release announce](https://github.com/maxGraph/maxGraph/discussions/147).

