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

import type Cell from '../cell/Cell';

declare module '../AbstractGraph' {
  interface AbstractGraph {
    /**
     * Specifies if labels should be visible. This is used in {@link getLabel}.
     * @default true
     */
    labelsVisible: boolean;

    /**
     * Specifies the return value for {@link isHtmlLabel}.
     * @default false
     */
    htmlLabels: boolean;

    /**
     * Returns a string or DOM node that represents the label for the given cell.
     *
     * This implementation uses {@link convertValueToString} if {@link labelsVisible} is `true`. Otherwise, it returns an empty string.
     *
     * To truncate a label to match the size of the cell, the following code can be used.
     *
     * ```javascript
     * const getLabel = graph.getLabel;
     * graph.getLabel = function(cell) {
     *   const label = getLabel.apply(this, arguments);
     *
     *   if (label && this.model.isVertex(cell)) {
     *     const geo = cell.getCellGeometry();
     *
     *     if (geo) {
     *       const max = parseInt(geo.width / 8);
     *
     *       if (label.length > max) {
     *         label = label.substring(0, max) + '...';
     *       }
     *     }
     *   }
     *   return StringUtils.htmlEntities(label);
     * }
     * ```
     *
     * A resize listener is needed in the graph to force a repaint of the label after a resize.
     *
     * ```javascript
     * graph.addListener(mxEvent.RESIZE_CELLS, function(sender, evt) {
     *   const cells = evt.getProperty('cells');
     *
     *   for (let i = 0; i < cells.length; i++) {
     *     this.view.removeState(cells[i]);
     *   }
     * });
     * ```
     *
     * @param cell {@link mxCell} whose label should be returned.
     */
    getLabel: (cell: Cell) => string | null;

    /**
     * Returns true if the label must be rendered as HTML markup.
     *
     * The default implementation returns {@link htmlLabels}.
     *
     * @param _cell {@link Cell} whose label should be displayed as HTML markup.
     */
    isHtmlLabel: (cell: Cell) => boolean;

    isLabelsVisible: () => boolean;

    /**
     * Returns {@link htmlLabels}.
     */
    isHtmlLabels: () => boolean;

    /**
     * Sets {@link htmlLabels}.
     */
    setHtmlLabels: (value: boolean) => void;

    /**
     * This enables wrapping for HTML labels.
     *
     * Returns `true` if no white-space CSS style directive should be used for displaying the given cells label.
     *
     * This implementation returns true if {@link 'whiteSpace'} in the style of the given cell is 'wrap'.
     *
     * This is used as a workaround for IE ignoring the white-space directive
     * of child elements if the directive appears in a parent element. It
     * should be overridden to return true if a white-space directive is used
     * in the HTML markup that represents the given cells label. In order for
     * HTML markup to work in labels, {@link isHtmlLabel} must also return true
     * for the given cell.
     *
     * @example
     *
     * ```javascript
     * const getLabel = graph.getLabel;
     * graph.getLabel = function(cell) {
     *   const tmp = getLabel.apply(this, arguments); // "supercall"
     *
     *   if (this.model.isEdge(cell)) {
     *     tmp = '<div style="width: 150px; white-space:normal;">'+tmp+'</div>';
     *   }
     *
     *   return tmp;
     * }
     *
     * graph.isWrapping = function(state) {
     * 	 return this.model.isEdge(state.cell);
     * }
     * ```
     *
     * Makes sure no edge label is wider than 150 pixels, otherwise the content
     * is wrapped. Note: No width must be specified for wrapped vertex labels as
     * the vertex defines the width in its geometry.
     *
     * @param cell {@link Cell} whose label should be wrapped.
     */
    isWrapping: (cell: Cell) => boolean;

    /**
     * Returns `true` if the overflow portion of labels should be hidden.
     *
     * If this returns `true` then vertex labels will be clipped to the size of the vertices.
     *
     * This implementation returns `true` if `overflow` in the style of the given cell is 'hidden'.
     *
     * @param cell {@link Cell} whose label should be clipped.
     */
    isLabelClipped: (cell: Cell) => boolean;

    /**
     * Returns `true` if the given edges' label is moveable.
     *
     * This returns {@link movable} for all given cells if {@link isCellLocked} does not return `true` for the given cell.
     *
     * @param cell {@link Cell} whose label should be moved.
     */
    isLabelMovable: (cell: Cell) => boolean;
  }
}
