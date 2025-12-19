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

import { test } from '@jest/globals';
import { createGraphWithoutPlugins } from '../../utils';
import { Cell, CellState, TooltipHandler } from '../../../src';

// ensure that no error occurs in this case
test('Call getTooltip when the "SelectionCellsHandler" plugin is not available', () => {
  const tooltipHandler = new TooltipHandler(createGraphWithoutPlugins());
  // just validate there is no error in this case
  tooltipHandler.getTooltip(new CellState(null, new Cell()), null!, 0, 0);
});
