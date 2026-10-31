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

import { beforeEach, expect, test } from '@jest/globals';
import { type CellStyle, Graph, Point } from '../../../../src';
import { createGraphWithoutContainer } from '../../../utils';

let graph: Graph;

beforeEach(() => {
  graph = createGraphWithoutContainer();
});

const computeAbsolutePoints = (
  style: CellStyle,
  targetPosition: [number, number] | null,
  controlPoints: Point[]
): number[][] => {
  const source = graph.insertVertex({ position: [0, 0], size: [40, 40] });
  const target = targetPosition
    ? graph.insertVertex({ position: targetPosition, size: [40, 40] })
    : source;
  const edge = graph.insertEdge({ source, target, style });
  edge.getGeometry()!.points = controlPoints;
  graph.view.invalidate();
  graph.view.validate();

  return graph.view.getState(edge)!.absolutePoints.map((point) => [point!.x, point!.y]);
};

test.each<[string, CellStyle, [number, number] | null, Point[], number[][]]>([
  [
    'a loop with fixed terminal points',
    { edgeStyle: 'loopEdgeStyle', exitX: 1, exitY: 0.25, entryX: 1, entryY: 0.75 },
    null,
    [new Point(60, 10), new Point(70, 30)],
    [
      [40, 10],
      [60, 10],
      [70, 30],
      [40, 30],
    ],
  ],
  [
    'segments',
    { edgeStyle: 'segmentEdgeStyle' },
    [200, 150],
    [new Point(100, 20), new Point(150, 120)],
    [
      [40, 20],
      [100, 20],
      [100, 120],
      [220, 120],
      [220, 150],
    ],
  ],
  [
    'manhattan, to the lower right',
    { edgeStyle: 'manhattanEdgeStyle' },
    [200, 150],
    [],
    [
      [40, 24],
      [216, 24],
      [216, 150],
    ],
  ],
  [
    'manhattan, to the upper left',
    { edgeStyle: 'manhattanEdgeStyle' },
    [-200, -150],
    [],
    [
      [0, 24],
      [-180, 24],
      [-180, -110],
    ],
  ],
  [
    'orthogonal, to the lower right',
    { edgeStyle: 'orthogonalEdgeStyle' },
    [200, 150],
    [],
    [
      [40, 20],
      [220, 20],
      [220, 150],
    ],
  ],
  [
    'orthogonal, to the upper left',
    { edgeStyle: 'orthogonalEdgeStyle' },
    [-200, -150],
    [],
    [
      [0, 20],
      [-180, 20],
      [-180, -110],
    ],
  ],
  [
    'orthogonal, around the source to a target behind it',
    { edgeStyle: 'orthogonalEdgeStyle', exitX: 1, exitY: 0.5, entryX: 0, entryY: 0.5 },
    [-300, 100],
    [],
    [
      [40, 20],
      [50, 20],
      [50, 70],
      [-310, 70],
      [-310, 120],
      [-300, 120],
    ],
  ],
])('route %s', (_description, style, targetPosition, controlPoints, expectedPoints) => {
  expect(computeAbsolutePoints(style, targetPosition, controlPoints)).toEqual(
    expectedPoints
  );
});
