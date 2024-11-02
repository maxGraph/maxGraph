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

import Point from './Point';

/**
 * Extends {@link Point} to implement a 2-dimensional rectangle with double
 * precision coordinates.
 *
 * Constructor: mxRectangle
 *
 * Constructs a new rectangle for the optional parameters. If no parameters
 * are given then the respective default values are used.
 */
class Rectangle extends Point {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    super(x, y);

    this.width = width;
    this.height = height;
  }

  /**
   * Holds the width of the rectangle.
   * @default 0
   */
  _width = 0;

  /**
   * Holds the height of the rectangle.
   * @default 0
   */
  _height = 0;

  get width() {
    return this._width;
  }

  set width(width: number) {
    if (Number.isNaN(width)) throw new Error('Invalid width supplied.');

    this._width = width;
  }

  get height() {
    return this._height;
  }

  set height(height: number) {
    if (Number.isNaN(height)) throw new Error('Invalid height supplied.');

    this._height = height;
  }

  /**
   * Returns a new {@link Rectangle} which is a copy of the given rectangle.
   */
  static fromRectangle = (rect: Rectangle) => {
    return new Rectangle(rect.x, rect.y, rect.width, rect.height);
  };

  /**
   * Sets this rectangle to the specified values
   */
  setRect(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Returns the x-coordinate of the center point.
   */
  getCenterX() {
    return this.x + this.width / 2;
  }

  /**
   * Returns the y-coordinate of the center point.
   */
  getCenterY() {
    return this.y + this.height / 2;
  }

  /**
   * Adds the given rectangle to this rectangle.
   */
  add(rect: Rectangle) {
    const minX = Math.min(this.x, rect.x);
    const minY = Math.min(this.y, rect.y);
    const maxX = Math.max(this.x + this.width, rect.x + rect.width);
    const maxY = Math.max(this.y + this.height, rect.y + rect.height);

    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  /**
   * Changes this rectangle to where it overlaps with the given rectangle.
   */
  intersect(rect: Rectangle) {
    const r1 = this.x + this.width;
    const r2 = rect.x + rect.width;

    const b1 = this.y + this.height;
    const b2 = rect.y + rect.height;

    this.x = Math.max(this.x, rect.x);
    this.y = Math.max(this.y, rect.y);
    this.width = Math.min(r1, r2) - this.x;
    this.height = Math.min(b1, b2) - this.y;
  }

  /**
   * Grows the rectangle by the given amount, that is, this method subtracts
   * the given amount from the x- and y-coordinates and adds twice the amount
   * to the width and height.
   */
  grow(amount: number) {
    this.x -= amount;
    this.y -= amount;
    this.width += 2 * amount;
    this.height += 2 * amount;
  }

  /**
   * Returns the top, left corner as a new {@link Point}.
   */
  getPoint() {
    return new Point(this.x, this.y);
  }

  /**
   * Rotates this rectangle by 90 degree around its center point.
   */
  rotate90() {
    const t = (this.width - this.height) / 2;
    this.x += t;
    this.y -= t;

    const tmp = this.width;
    this.width = this.height;
    this.height = tmp;
  }

  /**
   * Returns true if the given object equals this rectangle.
   */
  equals(rect: Rectangle | null) {
    if (!rect) return false;

    return (
      rect.x === this.x &&
      rect.y === this.y &&
      rect.width === this.width &&
      rect.height === this.height
    );
  }

  clone() {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }
}

export default Rectangle;
