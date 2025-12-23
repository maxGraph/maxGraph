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

import { mixInto } from '../../internal/utils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import { CellsMixin } from './CellsMixin.js';
import { ConnectionsMixin } from './ConnectionsMixin.js';
import { DragDropMixin } from './DragDropMixin.js';
import { EdgeMixin } from './EdgeMixin.js';
import { EditingMixin } from './EditingMixin.js';
import { EventsMixin } from './EventsMixin.js';
import { FoldingMixin } from './FoldingMixin.js';
import { GroupingMixin } from './GroupingMixin.js';
import { ImageMixin } from './ImageMixin.js';
import { LabelMixin } from './LabelMixin.js';
import { OrderMixin } from './OrderMixin.js';
import { OverlaysMixin } from './OverlaysMixin.js';
import { PageBreaksMixin } from './PageBreaksMixin.js';
import { PanningMixin } from './PanningMixin.js';
import { PortsMixin } from './PortsMixin.js';
import { SelectionMixin } from './SelectionMixin.js';
import { SnapMixin } from './SnapMixin.js';
import { SwimlaneMixin } from './SwimlaneMixin.js';
import { TerminalMixin } from './TerminalMixin.js';
import { ValidationMixin } from './ValidationMixin.js';
import { VertexMixin } from './VertexMixin.js';
import { ZoomMixin } from './ZoomMixin.js';

export const applyGraphMixins = (target: typeof AbstractGraph) => {
  const mixIntoGraph = mixInto(target);

  // Apply the mixins in alphabetic order to ease maintenance.
  // The order should have no influence of the resulting Graph prototype.
  for (const mixin of [
    CellsMixin,
    ConnectionsMixin,
    DragDropMixin,
    EdgeMixin,
    EditingMixin,
    EventsMixin,
    FoldingMixin,
    GroupingMixin,
    ImageMixin,
    LabelMixin,
    OrderMixin,
    PageBreaksMixin,
    OverlaysMixin,
    PanningMixin,
    PortsMixin,
    SelectionMixin,
    SnapMixin,
    SwimlaneMixin,
    TerminalMixin,
    ValidationMixin,
    VertexMixin,
    ZoomMixin,
  ]) {
    mixIntoGraph(mixin);
  }
};
