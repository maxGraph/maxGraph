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

import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  return {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // put the maxgraph code in a dedicated file. It lets know the size the produced bundle in an external application and if tree shaking works
            maxgraph: ['@maxgraph/core'],
          },
        },
      },
      chunkSizeWarningLimit: 435, // @maxgraph/core
    },
  };
});
