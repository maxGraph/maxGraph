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

import type { GraphPluginConstructor } from '../types';
import CellRenderer from './cell/CellRenderer';
import GraphDataModel from './GraphDataModel';
import GraphView from './GraphView';
import { Stylesheet } from './style/Stylesheet';
import { registerDefaultShapes } from './cell/register-shapes';
import { registerDefaultEdgeMarkers } from './geometry/edge/MarkerShape';
import { registerDefaultStyleElements } from './style/register';
import { getDefaultPlugins } from './plugins';
import { AbstractGraph, CollaboratorsGraphOptions } from './AbstractGraph';

// TODO review the JSDoc for the description of the class
/**
 * Extends {@link AbstractGraph} to implement a graph component that automatically loads some default built-ins (plugins, style elements).
 *
 * Good for evaluation and prototyping, but not recommended for production use. Use {@link BaseGraph} instead.
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
   * Creates a new {@link Stylesheet} to be used in this graph.
   */
  createStylesheet(): Stylesheet {
    return new Stylesheet();
  }

  protected override registerDefaults(): void {
    registerDefaultShapes();
    registerDefaultStyleElements();
    registerDefaultEdgeMarkers();
  }

  protected override initializeCollaborators(options: CollaboratorsGraphOptions): void {
    this.model = options.model ?? this.createGraphDataModel();
    this.cellRenderer = this.createCellRenderer();
    this.setStylesheet(options.stylesheet ?? this.createStylesheet());
    this.view = this.createGraphView();
  }

  constructor(
    container: HTMLElement,
    model?: GraphDataModel,
    plugins: GraphPluginConstructor[] = getDefaultPlugins(),
    stylesheet: Stylesheet | null = null
  ) {
    super({ container, model, plugins, stylesheet });
  }
}
