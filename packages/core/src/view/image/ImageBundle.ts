/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

type ImageMap = {
  [key: string]: {
    value: string;
    fallback: string;
  };
};

/**
 * Maps from keys to base64 encoded images or file locations. All values must
 * be URLs or use the format data:image/format followed by a comma and the base64
 * encoded image data, eg. "data:image/gif,XYZ", where XYZ is the base64 encoded
 * image data.
 *
 * To add a new image bundle to an existing graph, the following code is used:
 *
 * ```javascript
 * let bundle = new mxImageBundle(alt);
 * bundle.putImage('myImage', 'data:image/gif,R0lGODlhEAAQAMIGAAAAAICAAICAgP' +
 *   '//AOzp2O3r2////////yH+FUNyZWF0ZWQgd2l0aCBUaGUgR0lNUAAh+QQBCgAHACwAAAAA' +
 *   'EAAQAAADTXi63AowynnAMDfjPUDlnAAJhmeBFxAEloliKltWmiYCQvfVr6lBPB1ggxN1hi' +
 *   'laSSASFQpIV5HJBDyHpqK2ejVRm2AAgZCdmCGO9CIBADs=', fallback);
 * bundle.putImage('mySvgImage', 'data:image/svg+xml,' + encodeURIComponent(
 *   '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">' +
 *   '<linearGradient id="gradient"><stop offset="10%" stop-color="#F00"/>' +
 *   '<stop offset="90%" stop-color="#fcc"/></linearGradient>' +
 *   '<rect fill="url(#gradient)" width="100%" height="100%"/></svg>'), fallback);
 * graph.addImageBundle(bundle);
 * ```;
 *
 * Alt is an optional boolean (default is false) that specifies if the value
 * or the fallback should be returned in <getImage>.
 *
 * The image can then be referenced in any cell style using image=myImage.
 * If you are using mxOutline, you should use the same image bundles in the
 * graph that renders the outline.
 *
 * The keys for images are resolved in {@link Graph#postProcessCellStyle} and
 * turned into a data URI if the returned value has a short data URI format
 * as specified above.
 *
 * A typical value for the fallback is a HTML link as defined in RFC 2557.
 * Note that this format requires a file to be dynamically created on the
 * server-side, or the page that contains the graph to be modified to contain
 * the resources, this can be done by adding a comment that contains the
 * resource in the HEAD section of the page after the title tag.
 *
 * This type of fallback mechanism should be used in IE6 and IE7. IE8 does
 * support data URIs, but the maximum size is limited to 32 KB, which means
 * all data URIs should be limited to 32 KB.
 */
class ImageBundle {
  constructor(alt = false) {
    this.images = {};
    this.alt = alt;
  }

  /**
   * Maps from keys to images.
   */
  images: ImageMap;

  /**
   * Specifies if the fallback representation should be returned.
   */
  alt: boolean;

  /**
   * Adds the specified entry to the map. The entry is an object with a value and
   * fallback property as specified in the arguments.
   */
  putImage(key: string, value: string, fallback: string) {
    this.images[key] = { value, fallback };
  }

  /**
   * Returns the value for the given key. This returns the value
   * or fallback, depending on <alt>. The fallback is returned if
   * <alt> is true, the value is returned otherwise.
   */
  getImage(key: string) {
    let result = null;

    if (key) {
      const img = this.images[key];

      if (img) {
        result = this.alt ? img.fallback : img.value;
      }
    }

    return result;
  }
}

export default ImageBundle;
