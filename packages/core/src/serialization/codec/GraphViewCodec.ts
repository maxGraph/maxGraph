/*
Copyright 2023-present The maxGraph project Contributors

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

import ObjectCodec from '../ObjectCodec.js';
import { getNameFromRegistries } from './utils.js';
import GraphView from '../../view/GraphView.js';
import type Cell from '../../view/cell/Cell.js';
import type Point from '../../view/geometry/Point.js';
import type Codec from '../Codec.js';

function setNodeAttribute(node: Element, name: string, value: number) {
  node.setAttribute(name, `${value}`);
}

/**
 * Custom encoder for {@link GraphView}s.
 *
 * This class is created and registered dynamically at load time and used implicitly via {@link Codec} and the {@link CodecRegistry}.
 *
 * This codec only writes views into an XML format that can be used to create an image for the graph, that is,
 * it contains absolute coordinates with computed perimeters, edge styles and cell styles.
 *
 * @category Serialization with Codecs
 */
export class GraphViewCodec extends ObjectCodec {
  constructor() {
    super(new GraphView(undefined!));
    this.setName('GraphView');
  }

  /**
   * Encodes the given {@link GraphView} using {@link encodeCell} starting at the model's root. This returns the
   * top-level graph node of the recursive encoding.
   */
  override encode(enc: Codec, view: GraphView): Element | null {
    return this.encodeCell(enc, view, view.graph.getDataModel().getRoot()!);
  }

  /**
   * Recursively encodes the specified cell.
   *
   * Uses layer as the default node name. If the cell's parent is null, then graph is used for the node name.
   * If {@link Cell.isEdge} returns `true` for the cell, then edge is used for the node name, else if {@link Cell.isVertex} returns `true` for the cell,
   * then vertex is used for the node name.
   *
   * {@link AbstractGraph.getLabel} is used to create the label attribute for the cell.
   * For graph nodes and vertices the bounds are encoded into x, y, width and height.
   * For edges the points are encoded into a points attribute as a space-separated list of comma-separated coordinate pairs (e.g. x0,y0 x1,y1 ... xn,yn).
   * All values from the cell style are added as attribute values to the node.
   */
  encodeCell(enc: Codec, view: GraphView, cell: Cell): Element | null {
    let node: Element | null = null;
    const model = view.graph.getDataModel();
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
        node = enc.document.createElement(name);
        const lab = view.graph.getLabel(cell);

        if (lab != null) {
          node.setAttribute('label', lab);

          if (view.graph.isHtmlLabel(cell)) {
            node.setAttribute('html', 'true');
          }
        }

        if (parent == null) {
          const bounds = view.getGraphBounds();

          if (bounds != null) {
            setNodeAttribute(node, 'x', Math.round(bounds.x));
            setNodeAttribute(node, 'y', Math.round(bounds.y));
            setNodeAttribute(node, 'width', Math.round(bounds.width));
            setNodeAttribute(node, 'height', Math.round(bounds.height));
          }

          setNodeAttribute(node, 'scale', view.scale);
        } else if (state != null && geo != null) {
          for (const stylePropertyName of Object.keys(state.style)) {
            // @ts-ignore style is not defined as indexed type
            let value = state.style[stylePropertyName];

            // Tries to turn functions into strings
            if (typeof value === 'function') {
              value = getNameFromRegistries(value);
            }

            if (
              value != null &&
              typeof value !== 'function' &&
              typeof value !== 'object'
            ) {
              setNodeAttribute(node, stylePropertyName, value);
            }
          }

          const abs = state.absolutePoints;

          // Writes the list of points into one attribute
          if (abs != null && abs.length > 0) {
            let pts = `${Math.round((<Point>abs[0]).x)},${Math.round((<Point>abs[0]).y)}`;

            for (let i = 1; i < abs.length; i += 1) {
              pts += ` ${Math.round((<Point>abs[i]).x)},${Math.round((<Point>abs[i]).y)}`;
            }

            node.setAttribute('points', pts);
          }
          // Writes the bounds into 4 attributes
          else {
            setNodeAttribute(node, 'x', Math.round(state.x));
            setNodeAttribute(node, 'y', Math.round(state.y));
            setNodeAttribute(node, 'width', Math.round(state.width));
            setNodeAttribute(node, 'height', Math.round(state.height));
          }

          const offset = state.absoluteOffset;

          // Writes the offset into 2 attributes
          if (offset != null) {
            if (offset.x !== 0) {
              setNodeAttribute(node, 'dx', Math.round(offset.x));
            }

            if (offset.y !== 0) {
              setNodeAttribute(node, 'dy', Math.round(offset.y));
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
