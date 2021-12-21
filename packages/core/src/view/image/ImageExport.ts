/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import AbstractCanvas2D from '../canvas/AbstractCanvas2D';
import CellState from '../cell/CellState';
import Shape from '../geometry/Shape';

/**
 * Creates a new image export instance to be used with an export canvas. Here
 * is an example that uses this class to create an image via a backend using
 * <mxXmlExportCanvas>.
 *
 * ```javascript
 * var xmlDoc = mxUtils.createXmlDocument();
 * var root = xmlDoc.createElement('output');
 * xmlDoc.appendChild(root);
 *
 * var xmlCanvas = new mxXmlCanvas2D(root);
 * var imgExport = new mxImageExport();
 * imgExport.drawState(graph.getView().getState(graph.model.root), xmlCanvas);
 *
 * var bounds = graph.getGraphBounds();
 * var w = Math.ceil(bounds.x + bounds.width);
 * var h = Math.ceil(bounds.y + bounds.height);
 *
 * var xml = mxUtils.getXml(root);
 * new MaxXmlRequest('export', 'format=png&w=' + w +
 * 		'&h=' + h + '&bg=#F9F7ED&xml=' + encodeURIComponent(xml))
 * 		.simulate(document, '_blank');
 * ```
 *
 * @class ImageExport
 */
class ImageExport {
  constructor() {}

  /**
   * Specifies if overlays should be included in the export. Default is false.
   */
  includeOverlays = false;

  /**
   * Draws the given state and all its descendants to the given canvas.
   */
  drawState(state: CellState, canvas: AbstractCanvas2D): void {
    if (state) {
      this.visitStatesRecursive(state, canvas, () => {
        this.drawCellState(state, canvas);
      });

      // Paints the overlays
      if (this.includeOverlays) {
        this.visitStatesRecursive(state, canvas, () => {
          this.drawOverlays(state, canvas);
        });
      }
    }
  }

  /**
   * Visits the given state and all its descendants to the given canvas recursively.
   */
  visitStatesRecursive(state: CellState, canvas: AbstractCanvas2D, visitor: Function) {
    if (state) {
      visitor(state, canvas);

      const { graph } = state.view;
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
  getLinkForCellState(state: CellState, canvas: AbstractCanvas2D): any {
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
      state.overlays.visit((id, shape) => {
        if (shape instanceof Shape) {
          shape.paint(canvas);
        }
      });
    }
  }
}

export default ImageExport;
