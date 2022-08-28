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

/**
 * Encapsulates the URL, width and height of an image.
 *
 * Constructor: mxImage
 *
 * Constructs a new image.
 */
class ImageBox {
  constructor(src: string, width: number, height: number) {
    this.src = src;
    this.width = width;
    this.height = height;
  }

  /**
   * String that specifies the URL of the image.
   */
  src: string;

  /**
   * Integer that specifies the width of the image.
   */
  width: number;

  /**
   * Integer that specifies the height of the image.
   */
  height: number;
}

export default ImageBox;
