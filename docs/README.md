# Repository documentation

This directory holds the documentation intended for the maintainers and contributors of `maxGraph`. The documentation
for the users of the library is on the [maxGraph website](https://maxgraph.github.io/maxGraph).

## Architecture Decision Records

Structural decisions that cannot be inferred from the code alone are recorded in [`adr`](./adr/README.md): why a member
lives where it lives, why an obvious refactoring was set aside, and which constraint blocks a given change.

Start there before proposing a change to the `Graph` class hierarchy, the mixins or the plugins.

## Analyses

Analyses made before a decision are recorded in [`analyses`](./analyses/README.md): whether a change is feasible, what
it would gain, for instance in bundle size, what it would cost, and what it would break.

Check there whether a change you are considering has already been evaluated.

## Bundle size of the examples

The bundle size of the examples, for each released version, is recorded in
[`examples-bundle-size`](./examples-bundle-size/README.md): one CSV file for the examples of this repository, one for
the projects of the [maxgraph-integration-examples](https://github.com/maxGraph/maxgraph-integration-examples)
repository.

It is the source of the bundle size section of the release notes. Check it to see how a change affects the size of an
application compared to previous versions.
