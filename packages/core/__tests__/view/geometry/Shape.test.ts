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

import { beforeEach, describe, expect, test } from '@jest/globals';

import Shape from '../../../src/view/geometry/Shape';

describe('Shape', () => {
  // add test with other combination of values of arcSize
  describe('getArcSize', () => {
    let shape: Shape;

    beforeEach(() => {
      shape = new Shape();
    });

    // TODO split into 2 describe blocks regarding the absoluteArcSize (try to manage undefined absoluteArcSize as well)
    describe('absoluteArcSize: true', () => {
      test('arcSize 1', () => {
        shape.style = { absoluteArcSize: true, arcSize: 20 };
        expect(shape.getArcSize(100, 50)).toBe(10);
      });

      test('returns correct arc size when width is smaller than height', () => {
        shape.style = { absoluteArcSize: true, arcSize: 20 };
        expect(shape.getArcSize(50, 100)).toBe(10);
      });

      test('returns correct arc size when width and height are equal', () => {
        shape.style = { absoluteArcSize: true, arcSize: 20 };
        expect(shape.getArcSize(50, 50)).toBe(10);
      });

      test('returns correct arc size when arcSize is zero', () => {
        shape.style = { absoluteArcSize: true, arcSize: 0 };
        expect(shape.getArcSize(100, 50)).toBe(0);
      });

      test('returns correct arc size when width and height are zero', () => {
        shape.style = { absoluteArcSize: true, arcSize: 20 };
        expect(shape.getArcSize(0, 0)).toBe(0);
      });

      // TODO restore test
      // test('returns correct arc size when this.style?.absoluteArcSize is true', () => {
      //   shape.style = { absoluteArcSize: true, arcSize: 20 };
      //   expect(shape.getArcSize(100, 50)).toBe(10);
      // });
      //
      // test('returns correct arc size when this.style?.absoluteArcSize is true and arcSize is not set', () => {
      //   shape.style = { absoluteArcSize: true };
      //   expect(shape.getArcSize(100, 50)).toBe(10);
      // });
      //
      // // TODO rename test width smaller than height
      // test('returns correct arc size when this.style?.absoluteArcSize is true and arcSize is not set xxx', () => {
      //   shape.style = { absoluteArcSize: true };
      //   expect(shape.getArcSize(50, 200)).toBe(10);
      // });
    });

    describe('absoluteArcSize: false', () => {
      test('returns correct arc size when absoluteArcSize is false', () => {
        shape.style = { absoluteArcSize: false, arcSize: 20 };
        expect(shape.getArcSize(100, 50)).toBe(10);
      });

      test('returns correct arc size when arcSize is not defined', () => {
        shape.style = { absoluteArcSize: false };
        expect(shape.getArcSize(100, 50)).toBe(7.5);
      });
    });

    test('returns correct arc size when style is undefined', () => {
      shape.style = null;
      expect(shape.getArcSize(100, 50)).toBe(7.5);
    });
    test('returns correct arc size when style is undefined v2', () => {
      shape.style = null;
      expect(shape.getArcSize(200, 468)).toBe(30);
    });
  });
});
