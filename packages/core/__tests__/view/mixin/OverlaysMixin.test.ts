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

import { expect, test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { CellOverlay, type EventObject, ImageBox, InternalEvent } from '../../../src';

test('removeCellOverlays fires an event for every removed overlay', () => {
  const graph = createGraphWithoutPlugins();
  const cell = graph.insertVertex({ value: 'vertex' });
  const overlays = [
    graph.addCellOverlay(cell, new CellOverlay(new ImageBox('first.png', 16, 16))),
    graph.addCellOverlay(cell, new CellOverlay(new ImageBox('last.png', 16, 16))),
  ];
  const removedOverlays: CellOverlay[] = [];
  graph.addListener(
    InternalEvent.REMOVE_OVERLAY,
    (_sender: unknown, evt: EventObject) => {
      removedOverlays.push(evt.getProperty('overlay'));
    }
  );

  graph.removeCellOverlays(cell);

  expect(removedOverlays).toEqual(overlays);
});
