/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

/**
 * Class: mxImage
 *
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
