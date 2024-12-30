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

import { mixInto } from '../../util/Utils';
import { Graph } from '../Graph';
import { CellsMixin } from './CellsMixin';
import { ConnectionsMixin } from './ConnectionsMixin';
import { DragDropMixin } from './DragDropMixin';
import { EdgeMixin } from './EdgeMixin';
import { EditingMixin } from './EditingMixin';
import { EventsMixin } from './EventsMixin';
import { FoldingMixin } from './FoldingMixin';
import { GroupingMixin } from './GroupingMixin';
import { ImageMixin } from './ImageMixin';
import { LabelMixin } from './LabelMixin';
import { OrderMixin } from './OrderMixin';
import { OverlaysMixin } from './OverlaysMixin';
import { PageBreaksMixin } from './PageBreaksMixin';
import { PanningMixin } from './PanningMixin';
import { PortsMixin } from './PortsMixin';
import { SelectionMixin } from './SelectionMixin';
import { SnapMixin } from './SnapMixin';
import { SwimlaneMixin } from './SwimlaneMixin';
import { TerminalMixin } from './TerminalMixin';
import { TooltipMixin } from './TooltipMixin';
import { ValidationMixin } from './ValidationMixin';
import { VertexMixin } from './VertexMixin';
import { ZoomMixin } from './ZoomMixin';

export const applyGraphMixins = () => {
  const mixIntoGraph = mixInto(Graph);

  // Apply the mixins in alphabetic order to ease maintenance.
  // The order should have no influence of the resulting Graph prototype.
  for (const mixin of [
    // CellsMixin,
    // ConnectionsMixin,
    // DragDropMixin,
    // EdgeMixin,
    // EditingMixin,
    // EventsMixin,
    // FoldingMixin,
    // // GroupingMixin,
    // // ImageMixin,
    // LabelMixin,
    // // OrderMixin,
    // PageBreaksMixin,
    // OverlaysMixin,
    // PanningMixin,
    // PortsMixin,
    // SelectionMixin,
    // // SnapMixin,
    // SwimlaneMixin,
    // // TerminalMixin,
    // // TooltipMixin,
    // // ValidationMixin,
    // VertexMixin,
    // // ZoomMixin,
  ]) {
    mixIntoGraph(mixin);
  }
};
