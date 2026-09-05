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

import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

import ConnectionHandler from '../../../src/view/plugin/ConnectionHandler';
import { type AbstractGraph, BaseGraph, Point } from '../../../src';
import { createBaseGraph } from '../../utils';

let graph: AbstractGraph;
let plugin: ConnectionHandler;

beforeEach(() => {
  graph = createBaseGraph({ plugins: [ConnectionHandler] });
  plugin = graph.getPlugin<ConnectionHandler>('ConnectionHandler')!;
});

afterEach(() => {
  graph.destroy();
});

describe('connect', () => {
  test('store the waypoints in the edge geometry, unscaled and untranslated', () => {
    const source = graph.insertVertex({ position: [0, 0], size: [10, 10] });
    const target = graph.insertVertex({ position: [100, 100], size: [10, 10] });
    graph.view.scale = 2;
    graph.view.translate = new Point(5, 10);
    plugin.waypoints = [new Point(30, 40), new Point(50, 60)];

    plugin.connect(source, target, new MouseEvent('mouseup'));

    const edge = source.getEdgeAt(0);
    expect(edge.getTerminal(false)).toBe(target);
    expect(edge.getGeometry()!.points).toEqual([new Point(10, 10), new Point(20, 20)]);
  });
});
