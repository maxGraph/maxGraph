/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2015, JGraph Ltd
Copyright (c) 2006-2015, Gaudenz Alder

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

import type { GraphCollaboratorsOptions, GraphPluginConstructor } from '../types';
import { AbstractGraph } from './AbstractGraph';
import GraphView from './GraphView';
import CellRenderer from './cell/CellRenderer';
import GraphDataModel from './GraphDataModel';
import { Stylesheet } from './style/Stylesheet';
import GraphSelectionModel from './GraphSelectionModel';
import { registerDefaultShapes } from './cell/register-shapes';
import {
  registerDefaultEdgeMarkers,
  registerDefaultEdgeStyles,
  registerDefaultPerimeters,
} from './style/register';
import { getDefaultPlugins } from './plugins';

/**
 * An implementation of {@link AbstractGraph} that automatically loads some default built-ins (plugins, style elements).
 *
 * Good for evaluation and prototyping, but not recommended for production use. Use {@link BaseGraph} instead.
 *
 * @category Graph
 */
export class Graph extends AbstractGraph {
  /**
   * Creates a new {@link CellRenderer} to be used in this graph.
   */
  createCellRenderer(): CellRenderer {
    return new CellRenderer();
  }

  /**
   * Creates a new {@link GraphDataModel} to be used in this graph.
   */
  createGraphDataModel(): GraphDataModel {
    return new GraphDataModel();
  }

  /**
   * Creates a new {@link GraphView} to be used in this graph.
   */
  createGraphView(): GraphView {
    return new GraphView(this);
  }

  /**
   * Creates a new {@link GraphSelectionModel} to be used in this graph.
   */
  createSelectionModel() {
    return new GraphSelectionModel(this);
  }

  /**
   * Creates a new {@link Stylesheet} to be used in this graph.
   */
  createStylesheet(): Stylesheet {
    return new Stylesheet();
  }

  // Register all builtins provided by maxGraph
  protected override registerDefaults(): void {
    registerDefaultEdgeMarkers();
    registerDefaultEdgeStyles();
    registerDefaultPerimeters();
    registerDefaultShapes();
  }

  // Use the create factory methods of the class instead of the collaborators because they cannot be passed in the constructor
  protected override initializeCollaborators(options?: GraphCollaboratorsOptions): void {
    this.cellRenderer = this.createCellRenderer();
    this.model = options?.model ?? this.createGraphDataModel();
    this.setSelectionModel(this.createSelectionModel());
    this.setStylesheet(options?.stylesheet ?? this.createStylesheet());
    this.view = this.createGraphView();
  }

  constructor(
    container?: HTMLElement,
    model?: GraphDataModel,
    plugins: GraphPluginConstructor[] = getDefaultPlugins(),
    stylesheet?: Stylesheet | null
  ) {
    super({ container, model, plugins, stylesheet: stylesheet ?? undefined });
  }
}
