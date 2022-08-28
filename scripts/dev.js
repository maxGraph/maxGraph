/*
Copyright 2021-present The maxGraph project Contributors

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

const {execSync} = require('child_process');
const inquirer = require('inquirer');

run();

async function run() {
  const options = await acquireScopeOptions();
  const command = `npx lerna run dev --stream ${options}`;

  console.log(`Running '${command}'...`);

  try {
    execSync(command, { stdio: 'inherit' });
  } catch {}
}

async function acquireScopeOptions() {
  const input = await inquirer.prompt([
    {
      type: 'list',
      name: 'package',
      message: 'Select a package to run.',
      choices: [
        new inquirer.Separator(),
        ...getPackageNames(),
        new inquirer.Separator()
      ]
    }
  ]);

  return `--scope ${input.package}`;
}

function getPackageNames() {
  const command = 'npx lerna list -a --toposort --json';
  const packages = JSON.parse(execSync(command, { stdio: 'pipe' }).toString());

  return packages
    .map(package => package.name);
}
