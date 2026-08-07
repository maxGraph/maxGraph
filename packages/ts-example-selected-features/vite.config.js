/*
Copyright 2022-present The maxGraph project Contributors

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

import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { defineConfig } from 'vite';

// Vite resolves symlinks to their real path, so the module ids of @maxgraph/core point to the workspace directory
// instead of node_modules. Matching the resolved package directory keeps the chunk correct in both setups.
const maxGraphCoreDirectory = realpathSync(
  dirname(createRequire(import.meta.url).resolve('@maxgraph/core/package.json'))
);

export default defineConfig(({ mode }) => {
  return {
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                // put the maxgraph code in a dedicated file. It lets know the size the produced bundle in an external application and if tree shaking works
                name: 'maxgraph',
                test: maxGraphCoreDirectory,
              },
            ],
          },
        },
      },
      chunkSizeWarningLimit: 362, // @maxgraph/core
    },
  };
});
