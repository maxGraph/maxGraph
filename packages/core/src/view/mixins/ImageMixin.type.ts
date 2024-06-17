/*
Copyright 2024-present The maxGraph project Contributors

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

import type ImageBundle from '../image/ImageBundle';

declare module '../Graph' {
  interface Graph {
    imageBundles: ImageBundle[];

    /**
     * Adds the specified {@link ImageBundle}.
     */
    addImageBundle: (bundle: ImageBundle) => void;

    /**
     * Removes the specified {@link ImageBundle}.
     */
    removeImageBundle: (bundle: ImageBundle) => void;

    /**
     * Searches all {@link imageBundles} for the specified key and returns the value for the first match or `null` if the key is not found.
     */
    getImageFromBundles: (key: string) => string | null;
  }
}
