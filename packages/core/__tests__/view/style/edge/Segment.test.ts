/*
Copyright 2026-present The maxGraph project Contributors

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

import { describe, expect, test } from '@jest/globals';
import { type Cell, type CellStyle, Point } from '../../../../src';
import { createGraphWithoutContainer } from '../../../utils';

type Rect = [number, number, number, number];

interface RoutingCase {
  source: Rect;
  target: Rect;
  waypoints: [number, number][];
  /** Added to the style of the edge, to fix an end with exitX/exitY or entryX/entryY. */
  style?: CellStyle;
}

/**
 * Returns the absolute points of the edge, terminal points included, brought back to scale 1 and rounded to 0.1.
 * Both ends are floating unless the style of the case fixes one: the bends inside a terminal are only removed at a
 * floating end.
 */
const computeUnscaledRoute = (
  routingCase: RoutingCase,
  scale: number,
  edgeStyle = 'segmentEdgeStyle'
): number[][] => {
  const graph = createGraphWithoutContainer();
  const [sourceX, sourceY, sourceWidth, sourceHeight] = routingCase.source;
  const [targetX, targetY, targetWidth, targetHeight] = routingCase.target;
  let edge!: Cell;
  graph.batchUpdate(() => {
    const source = graph.insertVertex({
      position: [sourceX, sourceY],
      size: [sourceWidth, sourceHeight],
    });
    const target = graph.insertVertex({
      position: [targetX, targetY],
      size: [targetWidth, targetHeight],
    });
    edge = graph.insertEdge({
      source,
      target,
      style: { edgeStyle, ...routingCase.style },
    });
    edge.getGeometry()!.points = routingCase.waypoints.map(([x, y]) => new Point(x, y));
  });
  graph.view.setScale(scale);
  graph.view.revalidate();

  return graph.view
    .getState(edge)!
    .absolutePoints.map((point) => [
      Math.round((point!.x / scale) * 10) / 10,
      Math.round((point!.y / scale) * 10) / 10,
    ]);
};

/**
 * The default tolerance covers the rounding of the scaled coordinates to 0.1 pixel, brought back to scale 1, down to
 * a scale of about 0.5.
 */
const expectSameRoute = (
  actual: number[][],
  expected: number[][],
  tolerance = 0.2
): void => {
  expect(actual).toHaveLength(expected.length);
  actual.forEach(([x, y], index) => {
    expect(Math.abs(x - expected[index][0])).toBeLessThanOrEqual(tolerance);
    expect(Math.abs(y - expected[index][1])).toBeLessThanOrEqual(tolerance);
  });
};

describe('the route does not depend on the scale', () => {
  const issueDescription: RoutingCase = {
    source: [870, 430, 310, 70],
    target: [450, 250, 410, 80],
    waypoints: [
      [1025, 390],
      [655, 390],
    ],
  };
  const issueComment: RoutingCase = {
    source: [500, 500, 200, 200],
    target: [900, 900, 100, 100],
    waypoints: [
      [800, 650],
      [950, 800],
    ],
  };

  test.each<[string, RoutingCase, number[][]]>([
    [
      'issue description',
      issueDescription,
      [
        [1025, 430],
        [1025, 390],
        [655, 390],
        [655, 330],
      ],
    ],
    [
      'issue comment',
      issueComment,
      [
        [700, 650],
        [800, 650],
        [800, 800],
        [950, 800],
        [950, 900],
      ],
    ],
  ])('route of the %s at scale 1', (_description, routingCase, expectedRoute) => {
    expect(computeUnscaledRoute(routingCase, 1)).toEqual(expectedRoute);
  });

  // The bends were removed at 0.69 to 0.84 and 1.11 to 1.15 for the issue description, and at 0.8 to 0.87 for the
  // issue comment. The other scales guard the rest.
  const scales = [0.5, 0.69, 0.75, 0.8, 0.84, 0.87, 1.11, 1.12, 1.15, 1.2, 1.5, 2];
  test.each(
    [
      ['issue description', issueDescription],
      ['issue comment', issueComment],
    ].flatMap(([description, routingCase]) =>
      scales.map(
        (scale) => [description, scale, routingCase] as [string, number, RoutingCase]
      )
    )
  )('route of the %s at scale %f', (_description, scale, routingCase) => {
    expectSameRoute(
      computeUnscaledRoute(routingCase, scale),
      computeUnscaledRoute(routingCase, 1)
    );
  });

  // Both styles fall back to the segment connector when the edge has waypoints
  test.each(['orthogonalEdgeStyle', 'manhattanEdgeStyle'])(
    'route of the issue description with %s at scale 0.75',
    (edgeStyle) => {
      expectSameRoute(
        computeUnscaledRoute(issueDescription, 0.75, edgeStyle),
        computeUnscaledRoute(issueDescription, 1, edgeStyle)
      );
    }
  );
});

describe('bend exactly on a terminal border', () => {
  // The bends inside a terminal, border included, are removed, and this must not depend on the rounding of the scaled
  // coordinates.
  // The waypoint (540, 420) gives the bend (600, 420), on the top border of the target.
  const bendOnTargetBorder: RoutingCase = {
    source: [130, 550, 180, 110],
    target: [560, 420, 130, 160],
    waypoints: [
      [600, 600],
      [540, 420],
    ],
  };
  // The waypoint (160, 580) gives the bend (160, 580), on the bottom border of the source.
  const bendOnSourceBorder: RoutingCase = {
    source: [130, 420, 130, 160],
    target: [560, 550, 180, 110],
    waypoints: [
      [160, 580],
      [600, 640],
    ],
  };

  test('route at scale 1, without the bend on the target border', () => {
    // The route ends at (600, 580) on the target border, without going through the bend (600, 420)
    expect(computeUnscaledRoute(bendOnTargetBorder, 1)).toEqual([
      [310, 600],
      [600, 600],
      [600, 580],
    ]);
  });

  test('route at scale 1, without the bend on the source border', () => {
    // The route starts at (160, 580) on the source border: the bend there would repeat it
    expect(computeUnscaledRoute(bendOnSourceBorder, 1)).toEqual([
      [160, 580],
      [160, 640],
      [560, 640],
    ]);
  });

  // 1.2 ** 4 and 1.2 ** -4 are reached with four zoomIn or four zoomOut
  const scales = [1.2 ** 4, 1.2 ** -4, 0.555, 0.667, 0.75];
  test.each(
    [
      ['target', bendOnTargetBorder],
      ['source', bendOnSourceBorder],
    ].flatMap(([terminal, routingCase]) =>
      scales.map(
        (scale) =>
          [terminal, scale.toFixed(3), scale, routingCase] as [
            string,
            string,
            number,
            RoutingCase,
          ]
      )
    )
  )(
    'route with the bend on the %s border at scale %s',
    (_terminal, _scaleLabel, scale, routingCase) => {
      expectSameRoute(
        computeUnscaledRoute(routingCase, scale),
        computeUnscaledRoute(routingCase, 1)
      );
    }
  );
});

describe('bends inside a floating terminal', () => {
  // Each cleanup removes every bend inside its terminal, until the first bend outside, and may remove them all
  test.each<[string, RoutingCase, number[][]]>([
    [
      'two bends inside the source',
      {
        source: [100, 100, 200, 200],
        target: [600, 500, 100, 100],
        waypoints: [
          [150, 150],
          [250, 180],
          [650, 300],
        ],
      },
      [
        [300, 180],
        [650, 180],
        [650, 500],
      ],
    ],
    [
      'two bends inside the target',
      {
        source: [100, 100, 100, 100],
        target: [500, 400, 200, 200],
        waypoints: [
          [600, 150],
          [550, 450],
          [650, 500],
        ],
      },
      [
        [200, 150],
        [600, 150],
        [600, 400],
      ],
    ],
    [
      'the only bend, inside the source',
      {
        source: [100, 100, 200, 200],
        target: [150, 500, 100, 100],
        waypoints: [[200, 150]],
      },
      [
        [200, 300],
        [200, 500],
      ],
    ],
    [
      'the only bend, inside the target',
      {
        source: [150, 100, 100, 100],
        target: [100, 400, 200, 200],
        waypoints: [[200, 500]],
      },
      [
        [200, 200],
        [200, 400],
      ],
    ],
  ])('removes %s', (_description, routingCase, expectedRoute) => {
    for (const scale of [1, 0.75]) {
      expectSameRoute(computeUnscaledRoute(routingCase, scale), expectedRoute);
    }
  });
});

describe('bends inside a fixed terminal are kept', () => {
  // The bends (150, 200) and (150, 150) lie inside the source, (500, 450) on the border of the target
  test.each<[string, RoutingCase, number[][]]>([
    [
      'source',
      {
        source: [100, 100, 200, 200],
        target: [600, 500, 100, 100],
        waypoints: [
          [150, 150],
          [650, 300],
        ],
        style: { exitX: 1, exitY: 0.5 },
      },
      [
        [300, 200],
        [150, 200],
        [150, 150],
        [650, 150],
        [650, 500],
      ],
    ],
    [
      'target',
      {
        source: [100, 100, 100, 100],
        target: [500, 400, 200, 200],
        waypoints: [
          [300, 150],
          [550, 450],
        ],
        style: { entryX: 0, entryY: 0.5 },
      },
      [
        [200, 150],
        [300, 150],
        [300, 450],
        [500, 450],
        [500, 500],
      ],
    ],
  ])('fixed %s', (_terminal, routingCase, expectedRoute) => {
    expect(computeUnscaledRoute(routingCase, 1)).toEqual(expectedRoute);
  });
});

test('short segment next to a bend inside the source, at scale 0.1', () => {
  // The bend (165, 350) lies on the bottom border of the source and is removed. The bend (165, 355) next to it is
  // 0.5 pixel away at scale 0.1, under the tolerance of the segment connector: it must be kept, which requires removing
  // the first bend before applying the tolerance.
  const routingCase: RoutingCase = {
    source: [150, 280, 100, 70],
    target: [430, 400, 170, 150],
    waypoints: [
      [165, 350],
      [155, 355],
    ],
  };

  const route = computeUnscaledRoute(routingCase, 0.1);
  // At scale 0.1, the rounding to 0.1 pixel is 1 unit once brought back to scale 1
  expectSameRoute(route, computeUnscaledRoute(routingCase, 1), 1);
  expect(route).toContainEqual([165, 355]);
});

describe('segments shorter than 1 pixel', () => {
  // Not a wanted behaviour, a known limit: the segment connector skips a bend closer than 1 pixel to the previous one,
  // in view coordinates. So below a scale of about 0.15, a segment of a few units is dropped, which cannot be seen at
  // that scale. Moving the tolerance to model units is tracked in https://github.com/maxGraph/maxGraph/issues/1322.
  // The diagram is far from the origin so that, at a small scale, no scaled bend falls inside the unscaled bounds of a
  // terminal, which was the bug of issue 1051 and would hide this behaviour.
  const routingCase: RoutingCase = {
    source: [1000, 1000, 100, 60],
    target: [1500, 1300, 100, 60],
    waypoints: [
      [1250, 1150],
      [1400, 1155],
    ],
  };

  test('the segment of 5 units is kept at scale 0.5', () => {
    expect(computeUnscaledRoute(routingCase, 0.5)).toEqual([
      [1050, 1060],
      [1050, 1150],
      [1250, 1150],
      [1250, 1155],
      [1550, 1155],
      [1550, 1300],
    ]);
  });

  test('the segment of 5 units is dropped at scale 0.1', () => {
    // Expected to change with issue 1322: once the tolerance is in model units, the bend (1250, 1155) is kept as at
    // scale 0.5
    expect(computeUnscaledRoute(routingCase, 0.1)).toEqual([
      [1050, 1060],
      [1050, 1150],
      [1250, 1150],
      [1550, 1155],
      [1550, 1300],
    ]);
  });
});
