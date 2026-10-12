/* eslint-disable no-console -- command line script, the console is its output */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// The minimum TypeScript version supported by maxGraph. Hardcoded on purpose rather than read from package.json: a bump
// of the devDependency, by Dependabot for instance, must fail this check instead of silently raising the minimum.
const expectedVersion = '3.9.10';

const packageDirectory = fileURLToPath(new URL('..', import.meta.url));

const reportCheck = (name: string, passed: boolean): void => {
  if (passed) {
    console.info(`${name}: OK`);
  } else {
    console.error(`${name}: KO`);
  }
};

console.info(
  `Checking that the types of maxGraph compile with TypeScript ${expectedVersion}, the minimum supported version\n`
);

console.info('[1/2] TypeScript version');
// Resolve the compiler from this package, as npm does for its "tsc" command: the local copy first, then the hoisted one.
// Without the local copy, the TypeScript version used to develop maxGraph would silently check the types instead.
const require = createRequire(new URL('../package.json', import.meta.url));
const typescriptPackageJsonPath = require.resolve('typescript/package.json');
const actualVersion = (require(typescriptPackageJsonPath) as { version: string }).version;
console.info(`Expected: ${expectedVersion}`);
console.info(
  `Resolved: ${actualVersion}, from ${relative(packageDirectory, dirname(typescriptPackageJsonPath))}`
);
const isExpectedVersion = actualVersion === expectedVersion;
reportCheck('TypeScript version', isExpectedVersion);
if (!isExpectedVersion) {
  console.error(
    'Check the typescript devDependency, then run "npm install" from the repository root.'
  );
  process.exit(1);
}

console.info(
  `\n[2/2] Types: syntax, module resolution and type checking of src with TypeScript ${actualVersion}`
);
// Run the very compiler whose version was checked
const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc')], {
  cwd: packageDirectory,
  stdio: 'inherit',
});
const areTypesValid = result.status === 0;
reportCheck('Types', areTypesValid);
process.exit(areTypesValid ? 0 : 1);
