import { mixInto } from '../../util/Utils';
import Cell from '../cell/datatypes/Cell';
import { Graph } from '../Graph';

declare module '../Graph' {
  interface Graph {
    labelsVisible: boolean;
    htmlLabels: boolean;

    getLabel: (cell: Cell) => string | null;
    isHtmlLabel: (cell: Cell) => boolean;
    isLabelsVisible: () => boolean;
    isHtmlLabels: () => boolean;
    setHtmlLabels: (value: boolean) => void;
    isWrapping: (cell: Cell) => boolean;
    isLabelClipped: (cell: Cell) => boolean;
    isLabelMovable: (cell: Cell) => boolean;
  }
}

type PartialGraph = Pick<
  Graph,
  | 'convertValueToString'
  | 'getCurrentCellStyle'
  | 'isCellLocked'
  | 'isEdgeLabelsMovable'
  | 'isVertexLabelsMovable'
>;
type PartialLabel = Pick<
  Graph,
  | 'labelsVisible'
  | 'htmlLabels'
  | 'getLabel'
  | 'isHtmlLabel'
  | 'isLabelsVisible'
  | 'isHtmlLabels'
  | 'setHtmlLabels'
  | 'isWrapping'
  | 'isLabelClipped'
  | 'isLabelMovable'
>;
type PartialType = PartialGraph & PartialLabel;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
const GraphLabelMixin: PartialType = {
  /**
   * Returns a string or DOM node that represents the label for the given
   * cell. This implementation uses {@link convertValueToString} if {@link labelsVisible}
   * is true. Otherwise it returns an empty string.
   *
   * To truncate a label to match the size of the cell, the following code
   * can be used.
   *
   * ```javascript
   * graph.getLabel = function(cell)
   * {
   *   var label = getLabel.apply(this, arguments);
   *
   *   if (label != null && this.model.isVertex(cell))
   *   {
   *     var geo = cell.getCellGeometry();
   *
   *     if (geo != null)
   *     {
   *       var max = parseInt(geo.width / 8);
   *
   *       if (label.length > max)
   *       {
   *         label = label.substring(0, max)+'...';
   *       }
   *     }
   *   }
   *   return mxUtils.htmlEntities(label);
   * }
   * ```
   *
   * A resize listener is needed in the graph to force a repaint of the label
   * after a resize.
   *
   * ```javascript
   * graph.addListener(mxEvent.RESIZE_CELLS, function(sender, evt)
   * {
   *   var cells = evt.getProperty('cells');
   *
   *   for (var i = 0; i < cells.length; i++)
   *   {
   *     this.view.removeState(cells[i]);
   *   }
   * });
   * ```
   *
   * @param cell {@link mxCell} whose label should be returned.
   */
  getLabel(cell) {
    let result: string | null = '';

    if (this.isLabelsVisible() && cell != null) {
      const style = this.getCurrentCellStyle(cell);

      if (!(style.noLabel ?? false)) {
        result = this.convertValueToString(cell);
      }
    }

    return result;
  },

  /**
   * Returns true if the label must be rendered as HTML markup. The default
   * implementation returns {@link htmlLabels}.
   *
   * @param cell {@link mxCell} whose label should be displayed as HTML markup.
   */
  isHtmlLabel(cell) {
    return this.isHtmlLabels();
  },

  /**
   * Specifies if labels should be visible. This is used in {@link getLabel}. Default
   * is true.
   */
  labelsVisible: true,

  isLabelsVisible() {
    return this.labelsVisible;
  },

  /**
   * Specifies the return value for {@link isHtmlLabel}.
   * @default false
   */
  htmlLabels: false,

  /**
   * Returns {@link htmlLabels}.
   */
  isHtmlLabels() {
    return this.htmlLabels;
  },

  /**
   * Sets {@link htmlLabels}.
   */
  setHtmlLabels(value: boolean) {
    this.htmlLabels = value;
  },

  /**
   * This enables wrapping for HTML labels.
   *
   * Returns true if no white-space CSS style directive should be used for
   * displaying the given cells label. This implementation returns true if
   * {@link 'whiteSpace'} in the style of the given cell is 'wrap'.
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
   * graph.getLabel = function(cell)
   * {
   *   var tmp = getLabel.apply(this, arguments); // "supercall"
   *
   *   if (this.model.isEdge(cell))
   *   {
   *     tmp = '<div style="width: 150px; white-space:normal;">'+tmp+'</div>';
   *   }
   *
   *   return tmp;
   * }
   *
   * graph.isWrapping = function(state)
   * {
   * 	 return this.model.isEdge(state.cell);
   * }
   * ```
   *
   * Makes sure no edge label is wider than 150 pixels, otherwise the content
   * is wrapped. Note: No width must be specified for wrapped vertex labels as
   * the vertex defines the width in its geometry.
   *
   * @param state {@link mxCell} whose label should be wrapped.
   */
  isWrapping(cell) {
    return this.getCurrentCellStyle(cell).whiteSpace === 'wrap';
  },

  /**
   * Returns true if the overflow portion of labels should be hidden. If this
   * returns true then vertex labels will be clipped to the size of the vertices.
   * This implementation returns true if `overflow` in the
   * style of the given cell is 'hidden'.
   *
   * @param state {@link mxCell} whose label should be clipped.
   */
  isLabelClipped(cell) {
    return this.getCurrentCellStyle(cell).overflow === 'hidden';
  },

  /**
   * Returns true if the given edges's label is moveable. This returns
   * {@link movable} for all given cells if {@link isLocked} does not return true
   * for the given cell.
   *
   * @param cell {@link mxCell} whose label should be moved.
   */
  isLabelMovable(cell) {
    return (
      !this.isCellLocked(cell) &&
      ((cell.isEdge() && this.isEdgeLabelsMovable()) ||
        (cell.isVertex() && this.isVertexLabelsMovable()))
    );
  },
};

mixInto(Graph)(GraphLabelMixin);
