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

import { mixInto } from '../../util/Utils';
import { Graph } from '../Graph';
import ImageBundle from '../image/ImageBundle';

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

/*****************************************************************************
 * Group: Image bundles
 *****************************************************************************/

type PartialImage = Pick<
  Graph,
  'imageBundles' | 'addImageBundle' | 'removeImageBundle' | 'getImageFromBundles'
>;
type PartialType = PartialImage;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const ImageMixin: PartialType = {
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

mixInto(Graph)(ImageMixin);
