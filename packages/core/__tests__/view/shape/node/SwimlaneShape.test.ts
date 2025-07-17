/*
Copyright 2025-present The maxGraph project Contributors

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
import SwimlaneShape from '../../../../src/view/shape/node/SwimlaneShape';

describe('getSwimlaneArcSize', () => {
  let shape: SwimlaneShape;

  beforeEach(() => {
    // the values passed to the constructor are not used in this test
    shape = new SwimlaneShape(null!, null!, null!);
  });

  describe('absoluteArcSize: true', () => {
    const ignoredStartParameter: number = null!;

    test('height is smaller than width', () => {
      shape.style = { absoluteArcSize: true, arcSize: 20 };
      expect(shape.getSwimlaneArcSize(100, 50, ignoredStartParameter)).toBe(10);
    });

    test('width is smaller than height', () => {
      shape.style = { absoluteArcSize: true, arcSize: 13 };
      expect(shape.getSwimlaneArcSize(50, 100, ignoredStartParameter)).toBe(6.5);
    });

    test('width and height are equal', () => {
      shape.style = { absoluteArcSize: true, arcSize: 30 };
      expect(shape.getSwimlaneArcSize(50, 50, ignoredStartParameter)).toBe(15);
    });

    test('arcSize is zero', () => {
      shape.style = { absoluteArcSize: true, arcSize: 0 };
      expect(shape.getSwimlaneArcSize(100, 50, ignoredStartParameter)).toBe(0);
    });

    test('width and height are zero', () => {
      shape.style = { absoluteArcSize: true, arcSize: 60 };
      expect(shape.getSwimlaneArcSize(0, 0, ignoredStartParameter)).toBe(0);
    });

    test('arcSize is not set, large dimensions', () => {
      shape.style = { absoluteArcSize: true };
      expect(shape.getSwimlaneArcSize(170, 90, ignoredStartParameter)).toBe(10);
    });

    test('arcSize is not set, small dimensions', () => {
      shape.style = { absoluteArcSize: true };
      expect(shape.getSwimlaneArcSize(10, 17, ignoredStartParameter)).toBe(5);
    });
  });

  // describe.each([false, undefined])(
  //   'absoluteArcSize: %s',
  //   (absoluteArcSize?: boolean) => {
  //     test('height is smaller than width', () => {
  //       shape.style = { absoluteArcSize, arcSize: 40 };
  //       expect(shape.getSwimlaneArcSize(400, 350)).toBe(140);
  //     });
  //
  //     test('width is smaller than height', () => {
  //       shape.style = { absoluteArcSize, arcSize: 30 };
  //       expect(shape.getSwimlaneArcSize(40, 60)).toBe(12);
  //     });
  //
  //     test('width and height are equal', () => {
  //       shape.style = { absoluteArcSize, arcSize: 60 };
  //       expect(shape.getSwimlaneArcSize(85, 85)).toBe(51);
  //     });
  //
  //     test('arcSize not set, height is smaller than width', () => {
  //       shape.style = { absoluteArcSize };
  //       expect(shape.getSwimlaneArcSize(400, 350)).toBe(52.5);
  //     });
  //
  //     test('arcSize not set, width is smaller than height', () => {
  //       shape.style = { absoluteArcSize };
  //       expect(shape.getSwimlaneArcSize(40, 60)).toBe(6);
  //     });
  //
  //     test('arcSize not set, width and height are equal', () => {
  //       shape.style = { absoluteArcSize };
  //       expect(shape.getSwimlaneArcSize(85, 85)).toBe(12.75);
  //     });
  //   }
  // );

  // describe('absoluteArcSize: true', () => {
  //   test('height is smaller than width', () => {
  //     shape.style = null;
  //     expect(shape.getSwimlaneArcSize(400, 350)).toBe(52.5);
  //   });
  //
  //   test('width is smaller than height', () => {
  //     shape.style = null;
  //     expect(shape.getSwimlaneArcSize(40, 60)).toBe(6);
  //   });
  //
  //   test('style is undefined, large dimensions', () => {
  //     shape.style = null;
  //     expect(shape.getSwimlaneArcSize(200, 468)).toBe(30);
  //   });
  //
  //   test('width and height are equal', () => {
  //     shape.style = null;
  //     expect(shape.getSwimlaneArcSize(85, 85)).toBe(12.75);
  //   });
  // });
});
