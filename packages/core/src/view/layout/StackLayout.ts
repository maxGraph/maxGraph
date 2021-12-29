/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import GraphLayout from './GraphLayout';
import Rectangle from '../geometry/Rectangle';
import { getValue } from '../../util/utils';
import { getNumber } from '../../util/stringUtils';
import { DEFAULT_STARTSIZE } from '../../util/constants';
import { Graph } from '../Graph';
import Cell from '../cell/Cell';
import Geometry from '../geometry/Geometry';
import CellArray from '../cell/CellArray';

/**
 * Extends <mxGraphLayout> to create a horizontal or vertical stack of the
 * child vertices. The children do not need to be connected for this layout
 * to work.
 *
 * Example:
 *
 * ```javascript
 * let layout = new mxStackLayout(graph, true);
 * layout.execute(graph.getDefaultParent());
 * ```
 *
 * Constructor: mxStackLayout
 *
 * Constructs a new stack layout layout for the specified graph,
 * spacing, orientation and offset.
 */
class StackLayout extends GraphLayout {
  constructor(
    graph: Graph,
    horizontal: boolean | null=null,
    spacing: number | null=null,
    x0: number | null=null,
    y0: number | null=null,
    border: number | null=null
  ) {
    super(graph);
    this.horizontal = horizontal != null ? horizontal : true;
    this.spacing = spacing != null ? spacing : 0;
    this.x0 = x0 != null ? x0 : 0;
    this.y0 = y0 != null ? y0 : 0;
    this.border = border != null ? border : 0;
  }

  /**
   * Specifies the orientation of the layout.
   */
  horizontal: boolean;

  /**
   * Specifies the spacing between the cells.
   */
  spacing: number;

  /**
   * Specifies the horizontal origin of the layout.
   */
  x0: number;

  /**
   * Specifies the vertical origin of the layout.
   */
  y0: number;

  /**
   * Border to be added if fill is true.
   */
  border: number = 0;

  /**
   * Top margin for the child area.
   */
  marginTop: number = 0;

  /**
   * Top margin for the child area.
   */
  marginLeft: number = 0;

  /**
   * Top margin for the child area.
   */
  marginRight: number = 0;

  /**
   * Top margin for the child area.
   */
  marginBottom: number = 0;

  /**
   * Boolean indicating if the location of the first cell should be kept, that is, it will not be moved to x0 or y0.
   */
  keepFirstLocation: boolean = false;

  /**
   * Boolean indicating if dimension should be changed to fill out the parent cell.
   */
  fill: boolean = false;

  /**
   * If the parent should be resized to match the width/height of the stack.
   */
  resizeParent: boolean = false;

  /**
   * Use maximum of existing value and new value for resize of parent.
   */
  resizeParentMax: boolean = false;

  /**
   * If the last element should be resized to fill out the parent.
   */
  resizeLast: boolean = false;

  /**
   * Value at which a new column or row should be created.
   */
  wrap: number | null = null;

  /**
   * If the strokeWidth should be ignored.
   */
  borderCollapse: boolean = true;

  /**
   * If gaps should be allowed in the stack.
   */
  allowGaps: boolean = false;

  /**
   * Grid size for alignment of position and size.
   */
  gridSize: number = 0;

  /**
   * Returns horizontal.
   */
  isHorizontal(): boolean {
    return this.horizontal;
  }

  /**
   * Implements mxGraphLayout.moveCell.
   */
  moveCell(cell: Cell, x: number, y: number): void {
    const model = this.graph.getDataModel();
    const parent = cell.getParent();
    const horizontal = this.isHorizontal();

    if (cell != null && parent != null) {
      let i = 0;
      let last = 0;
      const childCount = parent.getChildCount();
      let value = horizontal ? x : y;
      const pstate = this.graph.getView().getState(parent);

      if (pstate != null) {
        value -= horizontal ? pstate.x : pstate.y;
      }

      value /= this.graph.view.scale;

      for (i = 0; i < childCount; i += 1) {
        const child = parent.getChildAt(i);

        if (child !== cell) {
          const bounds = child.getGeometry();

          if (bounds != null) {
            const tmp = horizontal
              ? bounds.x + bounds.width / 2
              : bounds.y + bounds.height / 2;

            if (last <= value && tmp > value) {
              break;
            }

            last = tmp;
          }
        }
      }

      // Changes child order in parent
      let idx = parent.getIndex(cell);
      idx = Math.max(0, i - (i > idx ? 1 : 0));

      model.add(parent, cell, idx);
    }
  }

  /**
   * Returns the size for the parent container or the size of the graph container if the parent is a layer or the root of the model.
   */
  getParentSize(parent: Cell): Rectangle {
    const model = this.graph.getDataModel();
    let pgeo = <Rectangle>parent.getGeometry();

    // Handles special case where the parent is either a layer with no
    // geometry or the current root of the view in which case the size
    // of the graph's container will be used.
    if (
      this.graph.container != null &&
      ((pgeo == null && model.isLayer(parent)) ||
        parent === this.graph.getView().currentRoot)
    ) {
      const width = this.graph.container.offsetWidth - 1;
      const height = this.graph.container.offsetHeight - 1;
      pgeo = new Rectangle(0, 0, width, height);
    }
    return pgeo;
  }

  /**
   * Returns the cells to be layouted.
   */
  getLayoutCells(parent: Cell): CellArray {
    const model = this.graph.getDataModel();
    const childCount = parent.getChildCount();
    const cells = new CellArray();

    for (let i = 0; i < childCount; i += 1) {
      const child = parent.getChildAt(i);

      if (!this.isVertexIgnored(child) && this.isVertexMovable(child)) {
        cells.push(child);
      }
    }

    if (this.allowGaps) {
      cells.sort((c1, c2) => {
        const geo1 = <Geometry>c1.getGeometry();
        const geo2 = <Geometry>c2.getGeometry();

        return this.horizontal
          ? geo1.x === geo2.x
            ? 0
            : (geo1.x > geo2.x && geo2.x > 0)
            ? 1
            : -1
          : geo1.y === geo2.y
          ? 0
          : (geo1.y > geo2.y && geo2.y > 0)
          ? 1
          : -1;
      });
    }
    return cells;
  }

  /**
   * Snaps the given value to the grid size.
   */
  snap(value: number): number {
    if (this.gridSize != null && this.gridSize > 0) {
      value = Math.max(value, this.gridSize);

      if (value / this.gridSize > 1) {
        const mod = value % this.gridSize;
        value += mod > this.gridSize / 2 ? this.gridSize - mod : -mod;
      }
    }
    return value;
  }

  /**
   * Implements mxGraphLayout.execute.
   */
  execute(parent: Cell): void {
    if (parent != null) {
      const pgeo = this.getParentSize(parent);
      const horizontal = this.isHorizontal();
      const model = this.graph.getDataModel();
      let fillValue = null;

      if (pgeo != null) {
        fillValue = horizontal
          ? pgeo.height - this.marginTop - this.marginBottom
          : pgeo.width - this.marginLeft - this.marginRight;
        fillValue -= 2 * this.border;
      }
      
      let x0 = this.x0 + this.border + this.marginLeft;
      let y0 = this.y0 + this.border + this.marginTop;

      // Handles swimlane start size
      if (this.graph.isSwimlane(parent)) {
        // Uses computed style to get latest
        const style = this.graph.getCellStyle(parent);
        let start = getNumber(style, 'startSize', DEFAULT_STARTSIZE);
        const horz = getValue(style, 'horizontal', true) == 1;

        if (pgeo != null) {
          if (horz) {
            start = Math.min(start, pgeo.height);
          } else {
            start = Math.min(start, pgeo.width);
          }
        }

        if (horizontal === horz && fillValue != null) {
          fillValue -= start;
        }

        if (horz) {
          y0 += start;
        } else {
          x0 += start;
        }
      }

      model.beginUpdate();
      try {
        let tmp = 0;
        let last = null;
        let lastValue = 0;
        let lastChild = null;
        const cells = this.getLayoutCells(parent);

        for (let i = 0; i < cells.length; i += 1) {
          const child = cells[i];
          let geo = child.getGeometry();

          if (geo != null) {
            geo = geo.clone();

            if (this.wrap != null && last != null) {
              if (
                (horizontal &&
                  last.x + last.width + geo.width + 2 * this.spacing > this.wrap) ||
                (!horizontal &&
                  last.y + last.height + geo.height + 2 * this.spacing > this.wrap)
              ) {
                last = null;

                if (horizontal) {
                  y0 += tmp + this.spacing;
                } else {
                  x0 += tmp + this.spacing;
                }

                tmp = 0;
              }
            }

            tmp = Math.max(tmp, horizontal ? geo.height : geo.width);
            let sw = 0;

            if (!this.borderCollapse) {
              const childStyle = this.graph.getCellStyle(child);
              sw = getNumber(childStyle, 'strokeWidth', 1);
            }

            if (last != null) {
              const temp = lastValue + this.spacing + Math.floor(sw / 2);

              if (horizontal) {
                geo.x =
                  this.snap(
                    (this.allowGaps ? Math.max(temp, geo.x) : temp) - this.marginLeft
                  ) + this.marginLeft;
              } else {
                geo.y =
                  this.snap(
                    (this.allowGaps ? Math.max(temp, geo.y) : temp) - this.marginTop
                  ) + this.marginTop;
              }
            } else if (!this.keepFirstLocation) {
              if (horizontal) {
                geo.x =
                  this.allowGaps && geo.x > x0
                    ? Math.max(this.snap(geo.x - this.marginLeft) + this.marginLeft, x0)
                    : x0;
              } else {
                geo.y =
                  this.allowGaps && geo.y > y0
                    ? Math.max(this.snap(geo.y - this.marginTop) + this.marginTop, y0)
                    : y0;
              }
            }

            if (horizontal) {
              geo.y = y0;
            } else {
              geo.x = x0;
            }

            if (this.fill && fillValue != null) {
              if (horizontal) {
                geo.height = fillValue;
              } else {
                geo.width = fillValue;
              }
            }

            if (horizontal) {
              geo.width = this.snap(geo.width);
            } else {
              geo.height = this.snap(geo.height);
            }

            this.setChildGeometry(child, geo);
            lastChild = child;
            last = geo;

            if (horizontal) {
              lastValue = last.x + last.width + Math.floor(sw / 2);
            } else {
              lastValue = last.y + last.height + Math.floor(sw / 2);
            }
          }
        }

        if (this.resizeParent && pgeo != null && last != null && !parent.isCollapsed()) {
          this.updateParentGeometry(parent, pgeo, last);
        } else if (this.resizeLast && pgeo != null && last != null && lastChild != null) {
          if (horizontal) {
            last.width =
              pgeo.width - last.x - this.spacing - this.marginRight - this.marginLeft;
          } else {
            last.height = pgeo.height - last.y - this.spacing - this.marginBottom;
          }

          this.setChildGeometry(lastChild, last);
        }
      } finally {
        model.endUpdate();
      }
    }
  }

  /**
   * Sets the specific geometry to the given child cell.
   *
   * @param child The given child of <Cell>.
   * @param geo The specific geometry of <mxGeometry>.
   */
  setChildGeometry(child: Cell, geo: Geometry) {
    const geo2 = child.getGeometry();

    if (
      geo2 == null ||
      geo.x !== geo2.x ||
      geo.y !== geo2.y ||
      geo.width !== geo2.width ||
      geo.height !== geo2.height
    ) {
      this.graph.getDataModel().setGeometry(child, geo);
    }
  }

  /**
   * Updates the geometry of the given parent cell.
   *
   * @param parent The given parent of <Cell>.
   * @param pgeo The new <mxGeometry> for parent.
   * @param last The last <mxGeometry>.
   */
  updateParentGeometry(parent: Cell, pgeo: Geometry, last: Geometry) {
    const horizontal = this.isHorizontal();
    const model = this.graph.getDataModel();

    const pgeo2 = pgeo.clone();

    if (horizontal) {
      const tmp = last.x + last.width + this.marginRight + this.border;

      if (this.resizeParentMax) {
        pgeo2.width = Math.max(pgeo2.width, tmp);
      } else {
        pgeo2.width = tmp;
      }
    } else {
      const tmp = last.y + last.height + this.marginBottom + this.border;

      if (this.resizeParentMax) {
        pgeo2.height = Math.max(pgeo2.height, tmp);
      } else {
        pgeo2.height = tmp;
      }
    }

    if (
      pgeo.x !== pgeo2.x ||
      pgeo.y !== pgeo2.y ||
      pgeo.width !== pgeo2.width ||
      pgeo.height !== pgeo2.height
    ) {
      model.setGeometry(parent, pgeo2);
    }
  }
}

export default StackLayout;
