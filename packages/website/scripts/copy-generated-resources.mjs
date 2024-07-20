import { cpSync, rmSync } from 'node:fs';

function copySync(src, dest) {
  console.info(`Copying ${src} to ${dest}...`);
  cpSync(src, dest, { recursive: true });
  console.info('Copy done');
}

const targetDirectory = 'generated';
console.info(`Copying generated resources to the "${targetDirectory}" directory...`);

// clean existing resources
rmSync(targetDirectory, {
  recursive: true,
  force: true, // When true, exceptions will be ignored if path does not exist.
});

copySync('../core/build/api', `${targetDirectory}/api-docs`);
copySync('../html/dist', `${targetDirectory}/demo`);

console.info('Copy of generated resources done');
