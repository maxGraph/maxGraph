import { mixInto } from '../../util/utils';
import { Graph } from '../Graph';
import ImageBundle from '../image/ImageBundle';

declare module '../Graph' {
  interface Graph {
    imageBundles: ImageBundle[];

    addImageBundle: (bundle: ImageBundle) => void;
    removeImageBundle: (bundle: ImageBundle) => void;
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

const GraphImageMixin: PartialType = {
  imageBundles: [],

  /**
   * Adds the specified {@link ImageBundle}.
   */
  addImageBundle(bundle) {
    this.imageBundles.push(bundle);
  },

  /**
   * Removes the specified {@link ImageBundle}.
   */
  removeImageBundle(bundle) {
    const tmp: ImageBundle[] = [];
    for (let i = 0; i < this.imageBundles.length; i += 1) {
      if (this.imageBundles[i] !== bundle) {
        tmp.push(this.imageBundles[i]);
      }
    }
    this.imageBundles = tmp;
  },

  /**
   * Searches all {@link imageBundles} for the specified key and returns the value
   * for the first match or null if the key is not found.
   */
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

mixInto(Graph)(GraphImageMixin);
