# Bundle size of the examples

History of the bundle size of the examples, one file per repository:

- [`maxgraph-examples.csv`](./maxgraph-examples.csv): the examples of this repository (`packages/js-example*` and
  `packages/ts-example*`).
- [`maxgraph-integration-examples.csv`](./maxgraph-integration-examples.csv): the projects of the
  [maxgraph-integration-examples](https://github.com/maxGraph/maxgraph-integration-examples) repository, built with the
  same version of `@maxgraph/core`.

They are used to write the bundle size section of the release notes, and to follow the size evolution across versions.

## Format

- One row per version, in the `Version` column. One column per example.
- Sizes are in kB of minified JavaScript, as computed by the `build-all-examples.bash` script of each repository: the
  size in bytes divided by 1000 (not 1024), the same unit as the build output of Vite and rsbuild.
- `-` means that the example did not exist yet at this version, or was not measured.
- A row whose version carries a suffix, such as `0.24.0 (vite v8)`, gives the sizes of that version after a change of
  the build tooling (bundler upgrade). It tells the effect of the tooling apart from the effect of the changes in
  `maxGraph`.

## What the sizes measure

The two repositories do not measure the same thing:

- **maxGraph repository**: the size of the largest JavaScript file of the example. For the examples built with webpack
  (`js-example*`), it is the whole application. For the examples built with Vite (`ts-example*`), it is the chunk that
  contains `maxGraph` only, not the rest of the application.
- **maxgraph-integration-examples repository**: the sum of all the JavaScript files of the project, so the whole
  application, whatever the bundler. Some bundlers, like Farm, split the code into several chunks. For rsbuild, the
  `index.*.js` file is excluded, since it only contains the HTML generation and the application initialization.

The bundlers of the examples are not tuned, they mainly use their default configuration.

## Where the sizes come from

The history was initialized from the values tracked by the maintainers in a spreadsheet.

For a new version, the sizes are read from the CI logs, where both scripts print a CSV of the sizes:

- maxGraph: the `build_examples (ubuntu-24.04) / build` job of the `build.yml` workflow, on the `main` branch.
- maxgraph-integration-examples: the `build_projects (development)` job of the `check-typescript-projects.yml` workflow,
  which builds the projects against the `main` branch of `maxGraph`.

The columns use the names printed by the CI, which are the directory names of the examples, so the CSV output of the CI
maps directly to them.

## Notes on some versions

Only the values that need an explanation are commented here. A version that is not listed needs no comment.

### maxGraph repository

- **0.22.0**: the decrease of the `ts-example*` sizes may come in part from the upgrade of Vite from 6.3.5 to 7.2.1
  ([#941](https://github.com/maxGraph/maxGraph/pull/941)), through a more efficient tree-shaking or minification. This
  has not been verified.
- **0.24.0 (vite v8 / webpack 5.109)**: the sizes of 0.24.0 with the tooling upgrades made during the 0.25.0
  development, to tell their effect apart from the changes in `maxGraph`.
  - `ts-example*`: measured in the PR upgrading Vite from 7.3.3 to 8.2.1
    ([#1126](https://github.com/maxGraph/maxGraph/pull/1126)). Vite 8 replaces Rollup and esbuild with Rolldown and
    Oxc, so the bundler and the minifier both changed, which explains the decrease.
  - `js-example*`: extrapolated, not measured. The PR upgrading webpack to 5.109.2
    ([#1138](https://github.com/maxGraph/maxGraph/pull/1138)) measured the decrease on the `main` branch
    ([review](https://github.com/maxGraph/maxGraph/pull/1138#pullrequestreview-4897682937)), and that decrease is
    subtracted from the 0.24.0 values. For instance `js-example`: 468.70 - (468.90 - 466.80) = 466.60.

### maxgraph-integration-examples repository

- **0.24.0 (vite v8)**: the sizes of 0.24.0 after the upgrade of Vite from 7.3.2 to 8.2.1
  ([maxgraph-integration-examples#307](https://github.com/maxGraph/maxgraph-integration-examples/pull/307)). Only the
  projects built with Vite change (`lit-ts` and `vitejs-ts`). As in the maxGraph repository, Vite 8 replaces Rollup and
  esbuild with Rolldown and Oxc, so the bundler and the minifier both changed, which explains the decrease.
- **0.24.0 (vite v8 / parcel 2.16.4 / rsbuild 2.1)**: the sizes of 0.24.0 after the development dependencies upgrade
  that followed the Vite one
  ([maxgraph-integration-examples#309](https://github.com/maxGraph/maxgraph-integration-examples/pull/309)): parcel
  2.16.3 to 2.16.4, rsbuild 1.7.2 to 2.1.10, rollup 4.55.1 to 4.62.4 and `@rollup/plugin-terser` 0.4.4 to 1.0.0.
  Measured by the `build_projects (release)` job of the `check-typescript-projects.yml` workflow, which builds the
  projects with the released 0.24.0 and the current tooling. The `parcel-ts` size grows by about 10 kB.
