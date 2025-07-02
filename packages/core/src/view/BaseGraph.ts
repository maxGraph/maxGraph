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

import type { GraphCollaboratorsOptions } from '../types.js';
import { AbstractGraph } from './AbstractGraph.js';
import GraphDataModel from './GraphDataModel.js';
import CellRenderer from './cell/CellRenderer.js';
import { Stylesheet } from './style/Stylesheet.js';
import GraphSelectionModel from './GraphSelectionModel.js';
import GraphView from './GraphView.js';

/**
 * An implementation of {@link AbstractGraph} that does not load any default built-ins (plugins, style elements).
 *
 * This class is optimized for production environments by enabling efficient tree-shaking.
 *
 * For evaluation and prototyping purposes, consider using {@link Graph}, which requires less configuration.
 *
 * @category Graph
 */
export class BaseGraph extends AbstractGraph {
  protected override initializeCollaborators(options?: GraphCollaboratorsOptions): void {
    this.cellRenderer = options?.cellRenderer ?? new CellRenderer();
    this.model = options?.model ?? new GraphDataModel();
    this.setSelectionModel(
      options?.selectionModel?.(this) ?? new GraphSelectionModel(this)
    );
    this.setStylesheet(options?.stylesheet ?? new Stylesheet());
    this.view = options?.view?.(this) ?? new GraphView(this);
  }
}
