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

import AbstractCanvas2D from '../canvas/AbstractCanvas2D';
import CellState from '../cell/CellState';
import Shape from '../geometry/Shape';

/**
 * Creates a new image export instance to be used with an export canvas.
 *
 * Here is an example that uses this class to create an image via a backend using {@link XmlCanvas2D}.
 *
 * ```javascript
 * const xmlDoc = xmlUtils.createXmlDocument();
 * const root = xmlDoc.createElement('output');
 * xmlDoc.appendChild(root);
 *
 * const xmlCanvas = new XmlCanvas2D(root);
 * const imageExport = new ImageExport();
 *
 * imageExport.drawState(graph.getView().getState(graph.model.root), xmlCanvas);
 * const xml = xmlUtils.getXml(root);
 *
 * const bounds = graph.getGraphBounds();
 * const w = Math.ceil(bounds.x + bounds.width);
 * const h = Math.ceil(bounds.y + bounds.height);
 *
 * new MaxXmlRequest('export', 'format=png&w=' + w +
 * 		'&h=' + h + '&bg=#F9F7ED&xml=' + encodeURIComponent(xml))
 * 		.simulate(document, '_blank');
 * ```
 *
 * @category Serialization
 */
class ImageExport {
  /**
   * Specifies if overlays should be included in the export.
   * @default false
   */
  includeOverlays = false;

  /**
   * Draws the given state and all its descendants to the given canvas.
   */
  drawState(state: CellState, canvas: AbstractCanvas2D): void {
    if (state) {
      this.visitStatesRecursive(state, canvas, this.drawCellState.bind(this));

      // Paints the overlays
      if (this.includeOverlays) {
        this.visitStatesRecursive(state, canvas, this.drawOverlays.bind(this));
      }
    }
  }

  /**
   * Visits the given state and all its descendants to the given canvas recursively.
   */
  visitStatesRecursive(
    state: CellState,
    canvas: AbstractCanvas2D,
    visitor: (state: CellState, canvas: AbstractCanvas2D) => void
  ) {
    if (state) {
      visitor(state, canvas);

      const graph = state.view.graph;
      const childCount = state.cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const childState = graph.view.getState(state.cell.getChildAt(i));

        if (childState) this.visitStatesRecursive(childState, canvas, visitor);
      }
    }
  }

  /**
   * Returns the link for the given cell state and canvas. This returns null.
   */
  getLinkForCellState(_state: CellState, _canvas: AbstractCanvas2D): any {
    return null;
  }

  /**
   * Draws the given state to the given canvas.
   */
  drawCellState(state: CellState, canvas: AbstractCanvas2D): void {
    // Experimental feature
    const link = this.getLinkForCellState(state, canvas);

    if (link) {
      canvas.setLink(link);
    }

    // Paints the shape and text
    this.drawShape(state, canvas);
    this.drawText(state, canvas);

    if (link) {
      canvas.setLink(null);
    }
  }

  /**
   * Draws the shape of the given state.
   */
  drawShape(state: CellState, canvas: AbstractCanvas2D): void {
    if (state.shape instanceof Shape && state.shape.checkBounds()) {
      canvas.save();

      state.shape.beforePaint(canvas);
      state.shape.paint(canvas);
      state.shape.afterPaint(canvas);

      canvas.restore();
    }
  }

  /**
   * Draws the text of the given state.
   */
  drawText(state: CellState, canvas: AbstractCanvas2D): void {
    if (state.text && state.text.checkBounds()) {
      canvas.save();

      state.text.beforePaint(canvas);
      state.text.paint(canvas);
      state.text.afterPaint(canvas);

      canvas.restore();
    }
  }

  /**
   * Draws the overlays for the given state. This is called if <includeOverlays>
   * is true.
   */
  drawOverlays(state: CellState, canvas: AbstractCanvas2D): void {
    if (state.overlays != null) {
      state.overlays.visit((_id, shape) => {
        if (shape instanceof Shape) {
          shape.paint(canvas);
        }
      });
    }
  }
}

export default ImageExport;
