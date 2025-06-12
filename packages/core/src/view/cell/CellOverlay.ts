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

import Point from '../geometry/Point';
import Rectangle from '../geometry/Rectangle';
import EventSource from '../event/EventSource';
import ImageBox from '../image/ImageBox';
import CellState from './CellState';
import ObjectIdentity from '../../util/ObjectIdentity';
import { AlignValue, VAlignValue } from '../../types';

/**
 * Extends {@link EventSource} to implement a graph overlay, represented by an icon and a tooltip.
 *
 * Overlays can handle and fire  {@link InternalEvent.CLICK} events and are added to the graph using {@link AbstractGraph.addCellOverlay}, and removed using
 * {@link AbstractGraph.removeCellOverlay}, or {@link AbstractGraph.removeCellOverlays} to remove all overlays.
 * The {@link AbstractGraph.getCellOverlays} function returns the array of overlays for a given cell in a graph.
 * If multiple overlays exist for the same cell, then {@link getBounds} should be overridden in at least one of the overlays.
 *
 * Overlays appear on top of all cells in a special layer.
 * If this is not desirable, then the image must be rendered as part of the shape or label of the cell instead.
 *
 * For cell overlays to be printed, use {@link PrintPreview.printOverlays}.
 *
 * ### Example
 *
 * The following adds a new overlays for a given vertex and selects the cell if the overlay is clicked.
 *
 * ```javascript
 * const overlay = new CellOverlay(img, html);
 * graph.addCellOverlay(vertex, overlay);
 * overlay.addListener(InternalEvent.CLICK, (sender, evt) => {
 *   const cell = evt.getProperty('cell');
 *   graph.setSelectionCell(cell);
 * });
 * ```
 *
 * ### Events
 *
 * **{@link InternalEvent.CLICK}**
 *
 * Fires when the user clicks on the overlay.
 * In the {@link EventObject} parameter of the listener function:
 * - the `event` property contains the corresponding {@link MouseEvent}
 * - the `cell` property contains the {@link Cell}.
 *
 * For touch devices this is fired if the element receives a touchend event.
 */
class CellOverlay extends EventSource implements ObjectIdentity {
  /**
   * Constructs a new overlay using the given image and tooltip.
   *
   * @param image {@link Image} that represents the icon to be displayed.
   * @param tooltip Optional string that specifies the tooltip.
   * @param align Optional horizontal alignment for the overlay. Possible values are 'left', 'center' and 'right' (default).
   * @param verticalAlign Vertical alignment for the overlay. Possible values are 'top', 'middle' and 'bottom' (default).
   * @param offset
   * @param cursor
   */
  constructor(
    image: ImageBox,
    tooltip: string | null = null,
    align: AlignValue = 'right',
    verticalAlign: VAlignValue = 'bottom',
    offset: Point = new Point(),
    cursor = 'help'
  ) {
    super();

    this.image = image;
    this.tooltip = tooltip;
    this.align = align;
    this.verticalAlign = verticalAlign;
    this.offset = offset;
    this.cursor = cursor;
  }

  /**
   * Holds the {@link Image} to be used as the icon.
   */
  image: ImageBox;

  /**
   * Holds the optional string to be used as the tooltip.
   */
  tooltip?: string | null;

  /**
   * Holds the horizontal alignment for the overlay.
   *
   * For edges, the overlay always appears in the center of the edge.
   * @default 'right'
   */
  align: AlignValue = 'right';

  /**
   * Holds the vertical alignment for the overlay.
   *
   * For edges, the overlay always appears in the center of the edge.
   * @default 'bottom'
   */
  verticalAlign: VAlignValue = 'bottom';

  /**
   * Holds the offset as an {@link Point}. The offset will be scaled according to the
   * current scale.
   */
  offset = new Point();

  /**
   * Holds the cursor for the overlay.
   * @default 'help'.
   */
  cursor = 'help';

  /**
   * Defines the overlapping for the overlay, that is, the proportional distance
   * from the origin to the point defined by the alignment. Default is 0.5.
   */
  defaultOverlap = 0.5;

  /**
   * Returns the bounds of the overlay for the given <CellState> as an
   * {@link Rectangle}. This should be overridden when using multiple overlays
   * per cell so that the overlays do not overlap.
   *
   * The following example will place the overlay along an edge (where
   * x=[-1..1] from the start to the end of the edge and y is the
   * orthogonal offset in px).
   *
   * ```javascript
   * overlay.getBounds = function(state)
   * {
   *   var bounds = getBounds.apply(this, arguments);
   *
   *   if (state.view.graph.getDataModel().isEdge(state.cell))
   *   {
   *     var pt = state.view.getPoint(state, {x: 0, y: 0, relative: true});
   *
   *     bounds.x = pt.x - bounds.width / 2;
   *     bounds.y = pt.y - bounds.height / 2;
   *   }
   *
   *   return bounds;
   * };
   * ```
   *
   * @param state <CellState> that represents the current state of the
   * associated cell.
   */
  getBounds(state: CellState): Rectangle {
    const isEdge = state.cell.isEdge();
    const s = state.view.scale;
    let pt = null;

    const image = this.image;
    const w = image.width;
    const h = image.height;

    if (isEdge) {
      const pts = <Point[]>state.absolutePoints;

      if (pts.length % 2 === 1) {
        pt = pts[Math.floor(pts.length / 2)];
      } else {
        const idx = pts.length / 2;
        const p0 = pts[idx - 1];
        const p1 = pts[idx];
        pt = new Point(p0.x + (p1.x - p0.x) / 2, p0.y + (p1.y - p0.y) / 2);
      }
    } else {
      pt = new Point();

      if (this.align === 'left') {
        pt.x = state.x;
      } else if (this.align === 'center') {
        pt.x = state.x + state.width / 2;
      } else if (this.align === 'right') {
        pt.x = state.x + state.width;
      } else {
        throw new Error();
      }

      if (this.verticalAlign === 'top') {
        pt.y = state.y;
      } else if (this.verticalAlign === 'middle') {
        pt.y = state.y + state.height / 2;
      } else if (this.verticalAlign === 'bottom') {
        pt.y = state.y + state.height;
      } else {
        throw new Error();
      }
    }

    return new Rectangle(
      Math.round(pt.x - (w * this.defaultOverlap - this.offset.x) * s),
      Math.round(pt.y - (h * this.defaultOverlap - this.offset.y) * s),
      w * s,
      h * s
    );
  }

  /**
   * Returns the textual representation of the overlay to be used as the
   * tooltip. This implementation returns <tooltip>.
   */
  toString() {
    return this.tooltip;
  }
}

export default CellOverlay;
