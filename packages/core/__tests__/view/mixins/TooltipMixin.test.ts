/*
Copyright 2023-present The maxGraph project Contributors

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

import { test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { Cell, CellState } from '../../../src';

test('The "TooltipHandler" plugin is not available', () => {
  const graph = createGraphWithoutPlugins();
  graph.setTooltips(true);
});

test('The "SelectionCellsHandler" plugin is not available', () => {
  const graph = createGraphWithoutPlugins();
  graph.getTooltip(new CellState(null, new Cell()), null!, 0, 0);
});
