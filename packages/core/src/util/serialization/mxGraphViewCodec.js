/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import GraphView from '../../view/view/GraphView';
import mxObjectCodec from './mxObjectCodec';
import mxCodecRegistry from './mxCodecRegistry';

/**
 * Class: mxGraphViewCodec
 *
 * Custom encoder for <mxGraphView>s. This class is created
 * and registered dynamically at load time and used implicitly via
 * <mxCodec> and the <mxCodecRegistry>. This codec only writes views
 * into a XML format that can be used to create an image for
 * the graph, that is, it contains absolute coordinates with
 * computed perimeters, edge styles and cell styles.
 */
class mxGraphViewCodec extends mxObjectCodec {
  constructor() {
    super(new mxGraphView());
  }

  /**
   * Function: encode
   *
   * Encodes the given <mxGraphView> using <encodeCell>
   * starting at the model's root. This returns the
   * top-level graph node of the recursive encoding.
   */
  encode(enc, view) {
    return this.encodeCell(enc, view, view.graph.getModel().getRoot());
  }

  /**
   * Function: encodeCell
   *
   * Recursively encodes the specifed cell. Uses layer
   * as the default nodename. If the cell's parent is
   * null, then graph is used for the nodename. If
   * <Transactions.isEdge> returns true for the cell,
   * then edge is used for the nodename, else if
   * <Transactions.isVertex> returns true for the cell,
   * then vertex is used for the nodename.
   *
   * <mxGraph.getLabel> is used to create the label
   * attribute for the cell. For graph nodes and vertices
   * the bounds are encoded into x, y, width and height.
   * For edges the points are encoded into a points
   * attribute as a space-separated list of comma-separated
   * coordinate pairs (eg. x0,y0 x1,y1 ... xn,yn). All
   * values from the cell style are added as attribute
   * values to the node.
   */
  encodeCell(enc, view, cell) {
    const model = view.graph.getModel();
    const state = view.getState(cell);
    const parent = cell.getParent();

    if (parent == null || state != null) {
      const childCount = cell.getChildCount();
      const geo = cell.getGeometry();
      let name = null;

      if (parent === model.getRoot()) {
        name = 'layer';
      } else if (parent == null) {
        name = 'graph';
      } else if (cell.isEdge()) {
        name = 'edge';
      } else if (childCount > 0 && geo != null) {
        name = 'group';
      } else if (cell.isVertex()) {
        name = 'vertex';
      }

      if (name != null) {
        const node = enc.document.createElement(name);
        const lab = view.graph.getLabel(cell);

        if (lab != null) {
          node.setAttribute('label', view.graph.getLabel(cell));

          if (view.graph.isHtmlLabel(cell)) {
            node.setAttribute('html', true);
          }
        }

        if (parent == null) {
          const bounds = view.getGraphBounds();

          if (bounds != null) {
            node.setAttribute('x', Math.round(bounds.x));
            node.setAttribute('y', Math.round(bounds.y));
            node.setAttribute('width', Math.round(bounds.width));
            node.setAttribute('height', Math.round(bounds.height));
          }

          node.setAttribute('scale', view.scale);
        } else if (state != null && geo != null) {
          // Writes each key, value in the style pair to an attribute
          for (const i in state.style) {
            let value = state.style[i];

            // Tries to turn objects and functions into strings
            if (typeof value === 'function' && typeof value === 'object') {
              value = StyleRegistry.getName(value);
            }

            if (
              value != null &&
              typeof value !== 'function' &&
              typeof value !== 'object'
            ) {
              node.setAttribute(i, value);
            }
          }

          const abs = state.absolutePoints;

          // Writes the list of points into one attribute
          if (abs != null && abs.length > 0) {
            let pts = `${Math.round(abs[0].x)},${Math.round(abs[0].y)}`;

            for (let i = 1; i < abs.length; i += 1) {
              pts += ` ${Math.round(abs[i].x)},${Math.round(abs[i].y)}`;
            }

            node.setAttribute('points', pts);
          }

          // Writes the bounds into 4 attributes
          else {
            node.setAttribute('x', Math.round(state.x));
            node.setAttribute('y', Math.round(state.y));
            node.setAttribute('width', Math.round(state.width));
            node.setAttribute('height', Math.round(state.height));
          }

          const offset = state.absoluteOffset;

          // Writes the offset into 2 attributes
          if (offset != null) {
            if (offset.x !== 0) {
              node.setAttribute('dx', Math.round(offset.x));
            }

            if (offset.y !== 0) {
              node.setAttribute('dy', Math.round(offset.y));
            }
          }
        }

        for (let i = 0; i < childCount; i += 1) {
          const childNode = this.encodeCell(enc, view, cell.getChildAt(i));

          if (childNode != null) {
            node.appendChild(childNode);
          }
        }
      }
    }
    return node;
  }
}

// mxCodecRegistry.register(new mxGraphViewCodec());
export default mxGraphViewCodec;
