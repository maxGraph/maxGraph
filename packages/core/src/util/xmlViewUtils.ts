/*
Copyright 2026-present The maxGraph project Contributors
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

import { NS_SVG } from './Constants.js';
import Point from '../view/geometry/Point.js';
import type Cell from '../view/cell/Cell.js';
import type { AbstractGraph } from '../view/AbstractGraph.js';
import TemporaryCellStates from '../view/cell/TemporaryCellStates.js';
import Codec from '../serialization/Codec.js';

export const getViewXml = (
  graph: AbstractGraph,
  scale = 1,
  cells: Cell[] | null = null,
  x0 = 0,
  y0 = 0
): Element | null => {
  if (cells == null) {
    const model = graph.getDataModel();
    cells = [model.getRoot()!];
  }

  const view = graph.getView();
  let result = null;

  // Disables events on the view
  const eventsEnabled = view.isEventsEnabled();
  view.setEventsEnabled(false);

  // Workaround for label bounds not taken into account for image export.
  // Creates a temporary draw pane which is used for rendering the text.
  // Text rendering is required for finding the bounds of the labels.
  const { drawPane } = view;
  const { overlayPane } = view;

  if (graph.dialect === 'svg') {
    view.drawPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into a temporary container
    view.overlayPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.overlayPane);
  } else {
    view.drawPane = <SVGElement>view.drawPane.cloneNode(false);
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into a temporary container
    view.overlayPane = <SVGElement>view.overlayPane.cloneNode(false);
    view.canvas.appendChild(view.overlayPane);
  }

  // Resets the translation
  const translate = view.getTranslate();
  view.translate = new Point(x0, y0);

  // Creates the temporary cell states in the view
  const temp = new TemporaryCellStates(graph.getView(), scale, cells);

  try {
    const enc = new Codec();
    result = enc.encode(graph.getView());
  } finally {
    temp.destroy();
    view.translate = translate;
    view.canvas.removeChild(view.drawPane);
    view.canvas.removeChild(view.overlayPane);
    view.drawPane = drawPane;
    view.overlayPane = overlayPane;
    view.setEventsEnabled(eventsEnabled);
  }
  return result;
};
