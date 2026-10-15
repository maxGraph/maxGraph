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

import type { Cell, Graph } from '../../../src';

/**
 * Inserts a vertex for each letter of `vertexValues`, and an edge for each value of
 * `edgeValues`, going from the vertex of its first letter to the vertex of its second one.
 * The characters after the second one are ignored, they only make the values of parallel edges unique.
 */
export const insertCells = (
  graph: Graph,
  vertexValues: string,
  edgeValues: string[],
  parent?: Cell
) => {
  const vertices = new Map(
    vertexValues
      .split('')
      .map((value) => [value, graph.insertVertex({ parent, value, size: [40, 20] })])
  );
  for (const value of edgeValues) {
    const [source, target] = value.split('');
    graph.insertEdge({
      parent,
      value,
      source: vertices.get(source),
      target: vertices.get(target),
    });
  }
  return vertices;
};

export const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Returns the position of every vertex and the points of every edge, by cell value, including the cells nested in the
 * vertices.
 */
export const getPositions = (
  graph: Graph,
  parent = graph.getDefaultParent()
): Record<string, number[] | number[][] | null> =>
  Object.fromEntries(
    parent.children.flatMap((cell) =>
      cell.isVertex()
        ? [
            [cell.value, [round(cell.geometry!.x), round(cell.geometry!.y)]],
            ...Object.entries(getPositions(graph, cell)),
          ]
        : [
            [
              cell.value,
              cell.geometry!.points?.map((point) => [round(point.x), round(point.y)]) ??
                null,
            ],
          ]
    )
  );
