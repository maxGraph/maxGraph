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
 * Implements a 2-dimensional vector with double precision coordinates.
 *
 * @category Geometry
 */
class Point {
  /**
   * Constructs a new point for the optional x and y coordinates.
   *
   * @param x - The x-coordinate (default is 0).
   * @param y - The y-coordinate (default is 0).
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Holds the x-coordinate of the point. Default is 0.
   */
  _x = 0;

  /**
   * Holds the y-coordinate of the point. Default is 0.
   */
  _y = 0;

  get x() {
    return this._x;
  }

  set x(x: number) {
    if (Number.isNaN(x)) throw new Error('Invalid x supplied.');

    this._x = x;
  }

  get y() {
    return this._y;
  }

  set y(y: number) {
    if (Number.isNaN(y)) throw new Error('Invalid y supplied.');

    this._y = y;
  }

  /**
   * Returns true if the given object equals this point.
   */
  equals(p: Point | null) {
    if (!p) return false;

    return p.x === this.x && p.y === this.y;
  }

  /**
   * Returns a clone of this {@link Point}.
   */
  clone() {
    return new Point(this.x, this.y);
  }
}

export default Point;
