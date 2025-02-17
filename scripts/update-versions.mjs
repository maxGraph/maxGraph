/*
Copyright 2025-present The maxGraph project Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// IMPORTANT: this script is intended to run as part of a GitHub workflow which is not installing the dependencies of the project.
// So please, do not import code that is not provided by the node runtime. Otherwise, update the GitHub workflow definition
import { readFileSync, writeFileSync } from 'node:fs';

// run from the root of the repository: node scripts/update-versions.mjs 0.12.0.alpha-1
const newVersion = process.argv[2];

console.info('Updating version in various files, version:', newVersion);
updateVersionInRootPackageLockJsonFile(newVersion);
updateVersionInCorePackageJsonFile(newVersion);
updateVersionInSourceFile(newVersion);
console.info('Files have been updated');

function updateVersionInRootPackageLockJsonFile(newVersion) {
  const path = 'package-lock.json';
  console.info('Updating', path);
  const fileContent = readFileContent(path);
  const packageJson = JSON.parse(fileContent);
  packageJson.packages['packages/core'].version = newVersion;
  writeJsonContentToFile(path, packageJson);
}

function updateVersionInCorePackageJsonFile(newVersion) {
  const path = 'packages/core/package.json';
  console.info('Updating', path);
  const fileContent = readFileContent(path);
  const packageJson = JSON.parse(fileContent);
  packageJson.version = newVersion;
  writeJsonContentToFile(path, packageJson);
}

function updateVersionInSourceFile(newVersion) {
  const path = 'packages/core/src/util/Constants.ts';
  console.info('Updating', path);
  const content = readFileContent(path);
  // replace the 1st occurrence, this is OK as the constant appears only once in the file
  const updatedContent = content.replace(
    /const VERSION =.*/,
    `const VERSION = '${newVersion}';`
  );
  writeFileSync(path, updatedContent);
}

function readFileContent(path) {
  return readFileSync(path, 'utf8').toString();
}

function writeJsonContentToFile(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}
