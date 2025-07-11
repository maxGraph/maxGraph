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

import type { AbstractGraph } from '../AbstractGraph.js';
import type ImageBundle from '../image/ImageBundle.js';

type PartialImage = Pick<
  AbstractGraph,
  'imageBundles' | 'addImageBundle' | 'removeImageBundle' | 'getImageFromBundles'
>;
type PartialType = PartialImage;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const ImageMixin: PartialType = {
  addImageBundle(bundle) {
    this.imageBundles.push(bundle);
  },

  removeImageBundle(bundle) {
    const tmp: ImageBundle[] = [];
    for (let i = 0; i < this.imageBundles.length; i += 1) {
      if (this.imageBundles[i] !== bundle) {
        tmp.push(this.imageBundles[i]);
      }
    }
    this.imageBundles = tmp;
  },

  getImageFromBundles(key) {
    if (key) {
      for (let i = 0; i < this.imageBundles.length; i += 1) {
        const image = this.imageBundles[i].getImage(key);
        if (image) {
          return image;
        }
      }
    }
    return null;
  },
};
