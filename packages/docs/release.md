# Release how-to

This page explains the steps needed to release a new version of maxgraph@core.

Currently, the release is entirely manual. Automation will come later based on the information provided here.


## Preparation

Decide the new version depending on the types of changes:
- Follow [semver](https://semver.org/)
- Until we release the first major version, bump the minor version when the release includes new features or breaking changes

Review the milestone related to the new release. **Note:** we always put issues related to a version in a Milestone whose
name matches the version.
- Ensure the name of the milestone used for the new release version matches the name of the version that has is going to
be released. Renamed it if needed.
- Check that all issues related to the upcoming release are attached to the milestone. In particular, check the issues with
[no milestone](https://github.com/maxGraph/maxGraph/issues?q=is%3Aissue+is%3Aclosed+no%3Amilestone).
- Clean this opened milestone if some issues are still opened (move them to a new one or discard milestone from them)
- Close the milestone

Changes in the source code
- Update the version in [package.json](../core/package.json) and the `VERSION` constant in the [Client](../core/src/Client.ts) file.
- Update the [CHANGELOG](../../CHANGELOG.md) to list the major changes included in the new version. Be general and add a
link to the future GitHub release that will include detailed release notes like in the following.
```markdown
For more details, see the [0.1.0 Changelog](https://github.com/maxGraph/maxGraph/releases/tag/v0.1.0) in the GitHub releases page.
```
- Do a single commit including the changes described above.

Create a git tag, prefixing the version by `v`. For instance, if the version is 0.2.0, run
```
git tag v0.2.0
git push origin v0.2.0
```


## Publish the npm package

- Checkout the tag that has just been created
- From packages/core, run `npm publish`


## Create the GitHub release

**Example**: use the [maxGraph 0.1.0 release](https://github.com/maxGraph/maxGraph/releases/tag/v0.1.0) for inspiration

Create a [new draft release](https://github.com/maxGraph/maxGraph/releases/)
- name: use the version that has just been published
- tag: use the tag create before
- save it as a draft

Generate the list of the important changes by using the [automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes).
It relies on the labels of the merged Pull Requests included in this version and the [GitHub release configuration](../../.github/release.yml).

If the list is not accurate (for instance, an element is not placed in the right category), update the label(s) or the related
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
- see the [maxGraph 0.1.0 release announce](https://github.com/maxGraph/maxGraph/discussions/147) for instance.


## Update the integration examples repository

Once done, create a Pull Request in the [integration examples repository](https://github.com/maxGraph/maxgraph-integration-examples)
to use the new release. Use [PR #28](https://github.com/maxGraph/maxgraph-integration-examples/pull/28) as an example.

**Note:** the examples will be updated automatically in the future, see the [issue #27](https://github.com/maxGraph/maxgraph-integration-examples/issues/27) for more details.
