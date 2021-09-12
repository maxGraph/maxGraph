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
