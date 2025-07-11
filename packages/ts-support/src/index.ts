/*
Copyright 2022-present The maxGraph project Contributors

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

import {
  CellState,
  constants,
  Graph,
  InternalEvent,
  RubberBandHandler,
} from '@maxgraph/core';

const version = constants.VERSION;

// Creates the graph inside the given container
const container = document.getElementById('graph-container')!;
// Disables the built-in context menu
InternalEvent.disableContextMenu(container);

const graph = new Graph(container);
graph.setPanning(true); // Use mouse right button for panning

const rubberBandHandler = graph.getPlugin<RubberBandHandler>('RubberBandHandler');
if (rubberBandHandler) {
  rubberBandHandler.defaultOpacity = 50;
  rubberBandHandler.fadeOut = true;
}

// call methods and properties defined in mixins to ensure that interface augmentation is correctly defined
graph.getAllConnectionConstraints(new CellState(), true);
graph.cellsEditable = false;
graph.getFoldingImage(new CellState());
