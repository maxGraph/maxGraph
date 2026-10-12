# ts-support

Check the minimum TypeScript version required to use `maxGraph`.

## Setup

Initialize all packages
> From the repository root, run `npm install`.

Build maxgraph@core, which generates the type declarations checked here
> From the repository root, run `npm run build -w packages/core`.

## Run the test

Run `npm test`

The test fails when the resolved TypeScript version is not the expected one, hardcoded in `scripts/check-types.ts`.
To change the minimum supported version, update both this value and the `typescript` devDependency.
