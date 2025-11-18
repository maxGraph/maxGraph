/*
Copyright 2021-present The maxGraph project Contributors

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

import Cell from '../cell/Cell.js';
import {
  contains,
  getBoundingBox,
  getRotatedPoint,
  intersects,
  ptSegDistSq,
  toRadians,
} from '../../util/mathUtils.js';
import {
  getSizeForString,
  setCellStyleFlags,
  setCellStyles,
} from '../../util/styleUtils.js';
import { DEFAULT_FONTSIZE, DEFAULT_IMAGESIZE } from '../../util/Constants.js';
import Geometry from '../geometry/Geometry.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import Rectangle from '../geometry/Rectangle.js';
import Point from '../geometry/Point.js';
import { htmlEntities } from '../../util/StringUtils.js';
import CellState from '../cell/CellState.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import { cloneCells, getTopmostCells } from '../../util/cellArrayUtils.js';

type PartialGraph = Pick<
  AbstractGraph,
  | 'getView'
  | 'getStylesheet'
  | 'batchUpdate'
  | 'getDataModel'
  | 'fireEvent'
  | 'getDefaultParent'
  | 'getCurrentRoot'
  | 'getOverlap'
  | 'isRecursiveResize'
  | 'getCellRenderer'
  | 'getMaximumGraphBounds'
  | 'isExportEnabled'
  | 'isImportEnabled'
  | 'getImageFromBundles'
  | 'getSelectionCells'
  | 'getSelectionCell'
  | 'addAllEdges'
  | 'getAllEdges'
  | 'isCloneInvalidEdges'
  | 'isAllowDanglingEdges'
  | 'resetEdges'
  | 'isResetEdgesOnResize'
  | 'isResetEdgesOnMove'
  | 'isConstrainChild'
  | 'cellConnected'
  | 'isDisconnectOnMove'
  | 'isConstrainRelativeChildren'
  | 'disconnectGraph'
  | 'getEdgeValidationError'
  | 'getFoldingImage'
  | 'isHtmlLabel'
  | 'isGridEnabled'
  | 'snap'
  | 'getGridSize'
  | 'isAllowNegativeCoordinates'
  | 'setAllowNegativeCoordinates'
  | 'getEventTolerance'
  | 'isSwimlane'
  | 'getStartSize'
>;

type PartialCells = Pick<
  AbstractGraph,
  | 'cellsResizable'
  | 'cellsBendable'
  | 'cellsSelectable'
  | 'cellsDisconnectable'
  | 'autoSizeCells'
  | 'autoSizeCellsOnAdd'
  | 'cellsLocked'
  | 'cellsCloneable'
  | 'cellsDeletable'
  | 'cellsMovable'
  | 'extendParents'
  | 'extendParentsOnAdd'
  | 'extendParentsOnMove'
  | 'getBoundingBox'
  | 'removeStateForCell'
  | 'getCurrentCellStyle'
  | 'getCellStyle'
  | 'postProcessCellStyle'
  | 'setCellStyle'
  | 'toggleCellStyle'
  | 'toggleCellStyles'
  | 'setCellStyles'
  | 'toggleCellStyleFlags'
  | 'setCellStyleFlags'
  | 'alignCells'
  | 'cloneCell'
  | 'cloneCells'
  | 'addCell'
  | 'addCells'
  | 'cellsAdded'
  | 'autoSizeCell'
  | 'removeCells'
  | 'cellsRemoved'
  | 'toggleCells'
  | 'cellsToggled'
  | 'updateCellSize'
  | 'cellSizeUpdated'
  | 'getPreferredSizeForCell'
  | 'resizeCell'
  | 'resizeCells'
  | 'cellResized'
  | 'cellsResized'
  | 'resizeChildCells'
  | 'constrainChildCells'
  | 'scaleCell'
  | 'extendParent'
  | 'importCells'
  | 'moveCells'
  | 'cellsMoved'
  | 'translateCell'
  | 'getCellContainmentArea'
  | 'constrainChild'
  | 'getChildCells'
  | 'getCellAt'
  | 'getCells'
  | 'getCellsBeyond'
  | 'intersects'
  | 'isValidAncestor'
  | 'isCellLocked'
  | 'isCellsLocked'
  | 'setCellsLocked'
  | 'getCloneableCells'
  | 'isCellCloneable'
  | 'isCellsCloneable'
  | 'setCellsCloneable'
  | 'getExportableCells'
  | 'canExportCell'
  | 'getImportableCells'
  | 'canImportCell'
  | 'isCellSelectable'
  | 'isCellsSelectable'
  | 'setCellsSelectable'
  | 'getDeletableCells'
  | 'isCellDeletable'
  | 'isCellsDeletable'
  | 'setCellsDeletable'
  | 'isCellRotatable'
  | 'getMovableCells'
  | 'isCellMovable'
  | 'isCellsMovable'
  | 'setCellsMovable'
  | 'isCellResizable'
  | 'isCellsResizable'
  | 'setCellsResizable'
  | 'isCellBendable'
  | 'isCellsBendable'
  | 'setCellsBendable'
  | 'isAutoSizeCell'
  | 'isAutoSizeCells'
  | 'setAutoSizeCells'
  | 'isExtendParent'
  | 'isExtendParents'
  | 'setExtendParents'
  | 'isExtendParentsOnAdd'
  | 'setExtendParentsOnAdd'
  | 'isExtendParentsOnMove'
  | 'setExtendParentsOnMove'
  | 'getCursorForCell'
  | 'getCellBounds'
  | 'getBoundingBoxFromGeometry'
>;
type PartialType = PartialGraph & PartialCells;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const CellsMixin: PartialType = {
  cellsResizable: true,

  cellsBendable: true,

  cellsSelectable: true,

  cellsDisconnectable: true,

  autoSizeCells: false,

  autoSizeCellsOnAdd: false,

  cellsLocked: false,

  cellsCloneable: true,

  cellsDeletable: true,

  cellsMovable: true,

  extendParents: true,

  extendParentsOnAdd: true,

  extendParentsOnMove: false,

  getBoundingBox(cells) {
    let result = null;

    if (cells.length > 0) {
      for (const cell of cells) {
        if (cell.isVertex() || cell.isEdge()) {
          const bbox = this.getView().getBoundingBox(this.getView().getState(cell), true);

          if (bbox) {
            if (!result) {
              result = Rectangle.fromRectangle(bbox);
            } else {
              result.add(bbox);
            }
          }
        }
      }
    }
    return result;
  },

  removeStateForCell(cell) {
    for (const child of cell.getChildren()) {
      this.removeStateForCell(child);
    }

    this.getView().invalidate(cell, false, true);
    this.getView().removeState(cell);
  },

  /*****************************************************************************
   * Group: Cell styles
   *****************************************************************************/

  getCurrentCellStyle(cell, ignoreState = false) {
    const state = ignoreState ? null : this.getView().getState(cell);
    return state ? state.style : this.getCellStyle(cell);
  },

  getCellStyle(cell) {
    const cellStyle = cell.getStyle();
    const stylesheet = this.getStylesheet();

    // Gets the default style for the cell
    const defaultStyle = cell.isEdge()
      ? stylesheet.getDefaultEdgeStyle()
      : stylesheet.getDefaultVertexStyle();

    // Resolves the stylename using the above as the default
    const style = this.postProcessCellStyle(
      stylesheet.getCellStyle(cellStyle, defaultStyle ?? {})
    );

    return style;
  },

  postProcessCellStyle(style) {
    if (!style.image) {
      return style;
    }
    const key = <string>style.image;
    let image = this.getImageFromBundles(key);

    if (image) {
      style.image = image;
    } else {
      image = key;
    }

    // Converts short data uris to normal data uris
    if (image && image.substring(0, 11) === 'data:image/') {
      if (image.substring(0, 20) === 'data:image/svg+xml,<') {
        // Required for FF and IE11
        image = image.substring(0, 19) + encodeURIComponent(image.substring(19));
      } else if (image.substring(0, 22) !== 'data:image/svg+xml,%3C') {
        const comma = image.indexOf(',');

        // Adds base64 encoding prefix if needed
        if (comma > 0 && image.substring(comma - 7, comma + 1) !== ';base64,') {
          image = `${image.substring(0, comma)};base64,${image.substring(comma + 1)}`;
        }
      }

      style.image = image;
    }

    return style;
  },

  setCellStyle(style, cells?) {
    cells = cells ?? this.getSelectionCells();

    this.batchUpdate(() => {
      for (const cell of cells!) {
        this.getDataModel().setStyle(cell, style);
      }
    });
  },

  toggleCellStyle(key, defaultValue = false, cell?) {
    cell = cell ?? this.getSelectionCell();
    return this.toggleCellStyles(key, defaultValue, [cell]);
  },

  toggleCellStyles(key, defaultValue = false, cells?) {
    let value = false;

    cells = cells ?? this.getSelectionCells();

    if (cells.length > 0) {
      const style = this.getCurrentCellStyle(cells[0]);
      value = !(style[key] ?? defaultValue);
      this.setCellStyles(key, value, cells);
    }

    return value;
  },

  setCellStyles(key, value, cells) {
    cells = cells ?? this.getSelectionCells();

    setCellStyles(this.getDataModel(), cells, key, value);
  },

  toggleCellStyleFlags(key, flag, cells) {
    cells = cells ?? this.getSelectionCells();

    this.setCellStyleFlags(key, flag, null, cells);
  },

  setCellStyleFlags(key, flag, value = null, cells) {
    cells = cells ?? this.getSelectionCells();

    if (cells.length > 0) {
      if (value === null) {
        const style = this.getCurrentCellStyle(cells[0]);

        const current = (style[key] as number) || 0;
        value = !((current & flag) === flag);
      }
      setCellStyleFlags(this.getDataModel(), cells, key, flag, value);
    }
  },

  /*****************************************************************************
   * Group: Cell alignment and orientation
   *****************************************************************************/

  alignCells(align, cells, param = null) {
    cells = cells ?? this.getSelectionCells();

    if (cells.length > 1) {
      // Finds the required coordinate for the alignment
      if (param === null) {
        for (const cell of cells) {
          const state = this.getView().getState(cell);

          if (state && !cell.isEdge()) {
            if (param === null) {
              switch (align) {
                case 'center':
                  param = state.x + state.width / 2;
                  break;
                case 'right':
                  param = state.x + state.width;
                  break;
                case 'top':
                  param = state.y;
                  break;
                case 'middle':
                  param = state.y + state.height / 2;
                  break;
                case 'bottom':
                  param = state.y + state.height;
                  break;
                default:
                  param = state.x;
                  break;
              }
            } else
              switch (align) {
                case 'right': {
                  param = Math.max(param, state.x + state.width);
                  break;
                }
                case 'top': {
                  param = Math.min(param, state.y);
                  break;
                }
                case 'bottom': {
                  param = Math.max(param, state.y + state.height);
                  break;
                }
                default: {
                  param = Math.min(param, state.x);
                }
              }
          }
        }
      }

      // Aligns the cells to the coordinate
      if (param !== null) {
        const s = this.getView().scale;

        this.batchUpdate(() => {
          const p = param as number;

          for (const cell of cells as Cell[]) {
            const state = this.getView().getState(cell);

            if (state != null) {
              let geo = cell.getGeometry();

              if (geo != null && !cell.isEdge()) {
                geo = geo.clone();

                switch (align) {
                  case 'center': {
                    geo.x += (p - state.x - state.width / 2) / s;

                    break;
                  }
                  case 'right': {
                    geo.x += (p - state.x - state.width) / s;

                    break;
                  }
                  case 'top': {
                    geo.y += (p - state.y) / s;

                    break;
                  }
                  case 'middle': {
                    geo.y += (p - state.y - state.height / 2) / s;

                    break;
                  }
                  case 'bottom': {
                    geo.y += (p - state.y - state.height) / s;

                    break;
                  }
                  default: {
                    geo.x += (p - state.x) / s;
                  }
                }

                this.resizeCell(cell, geo);
              }
            }
          }

          this.fireEvent(new EventObject(InternalEvent.ALIGN_CELLS, { align, cells }));
        });
      }
    }

    return cells;
  },

  /*****************************************************************************
   * Group: Cell cloning, insertion and removal
   *****************************************************************************/

  cloneCell(cell, allowInvalidEdges = false, mapping = {}, keepPosition = false) {
    return this.cloneCells([cell], allowInvalidEdges, mapping, keepPosition)[0];
  },

  cloneCells(cells, allowInvalidEdges = true, mapping = {}, keepPosition = false) {
    let clones: Cell[];

    // Creates a map for fast lookups
    const dict = new Map<Cell, boolean>();
    const tmp = [];

    for (const cell of cells) {
      dict.set(cell, true);
      tmp.push(cell);
    }

    if (tmp.length > 0) {
      const { scale } = this.getView();
      const trans = this.getView().translate;
      const out: Cell[] = [];
      clones = cloneCells(cells, true, mapping);

      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];
        const clone = clones[i];

        if (
          !allowInvalidEdges &&
          clone.isEdge() &&
          this.getEdgeValidationError(
            clone,
            clone.getTerminal(true),
            clone.getTerminal(false)
          ) !== null
        ) {
          //clones[i] = null;
        } else {
          out.push(clone);
          const g = clone.getGeometry();

          if (g) {
            const state = this.getView().getState(cell);
            const parent = cell.getParent();
            const pstate = parent ? this.getView().getState(parent) : null;

            if (state && pstate) {
              const dx = keepPosition ? 0 : (<Point>pstate.origin).x;
              const dy = keepPosition ? 0 : (<Point>pstate.origin).y;

              if (clone.isEdge()) {
                const pts = state.absolutePoints;

                // Checks if the source is cloned or sets the terminal point
                let src = cell.getTerminal(true);

                while (src && !dict.get(src)) {
                  src = src.getParent();
                }

                if (!src && pts[0]) {
                  g.setTerminalPoint(
                    new Point(pts[0].x / scale - trans.x, pts[0].y / scale - trans.y),
                    true
                  );
                }

                // Checks if the target is cloned or sets the terminal point
                let trg = cell.getTerminal(false);
                while (trg && !dict.get(trg)) {
                  trg = trg.getParent();
                }

                const n = pts.length - 1;
                const p = pts[n];

                if (!trg && p) {
                  g.setTerminalPoint(
                    new Point(p.x / scale - trans.x, p.y / scale - trans.y),
                    false
                  );
                }

                // Translates the control points
                const { points } = g;
                if (points) {
                  for (const point of points) {
                    point.x += dx;
                    point.y += dy;
                  }
                }
              } else {
                g.translate(dx, dy);
              }
            }
          }
        }
      }
      clones = out;
    } else {
      clones = [];
    }
    return clones;
  },

  addCell(cell, parent = null, index = null, source = null, target = null) {
    return this.addCells([cell], parent, index, source, target)[0];
  },

  addCells(
    cells,
    parent = null,
    index = null,
    source = null,
    target = null,
    absolute = false
  ) {
    const p = parent ?? this.getDefaultParent();
    const i = index ?? p.getChildCount();

    this.batchUpdate(() => {
      this.cellsAdded(cells, p, i, source, target, absolute, true);
      this.fireEvent(
        new EventObject(InternalEvent.ADD_CELLS, { cells, p, i, source, target })
      );
    });

    return cells;
  },

  cellsAdded(
    cells,
    parent,
    index,
    source = null,
    target = null,
    absolute = false,
    constrain = false,
    extend = true
  ) {
    this.batchUpdate(() => {
      const parentState = absolute ? this.getView().getState(parent) : null;
      const o1 = parentState ? parentState.origin : null;
      const zero = new Point(0, 0);

      cells.forEach((cell, i) => {
        /* Can cells include null values?
        if (cell == null) {
          index--;
        } else {
        */
        const previous = cell.getParent();

        // Keeps the cell at its absolute location
        if (o1 && cell !== parent && parent !== previous) {
          const oldState = previous ? this.getView().getState(previous) : null;
          const o2 = oldState ? oldState.origin : zero;
          let geo = cell.getGeometry();

          if (geo) {
            const dx = o2.x - o1.x;
            const dy = o2.y - o1.y;

            // FIXME: Cells should always be inserted first before any other edit
            // to avoid forward references in sessions.
            geo = geo.clone();
            geo.translate(dx, dy);

            if (!geo.relative && cell.isVertex() && !this.isAllowNegativeCoordinates()) {
              geo.x = Math.max(0, geo.x);
              geo.y = Math.max(0, geo.y);
            }

            this.getDataModel().setGeometry(cell, geo);
          }
        }

        // Decrements all following indices
        // if cell is already in parent
        if (parent === previous && index + i > parent.getChildCount()) {
          index--;
        }

        this.getDataModel().add(parent, cell, index + i);

        if (this.autoSizeCellsOnAdd) {
          this.autoSizeCell(cell, true);
        }

        // Extends the parent or constrains the child
        if (
          (!extend || extend) &&
          this.isExtendParentsOnAdd(cell) &&
          this.isExtendParent(cell)
        ) {
          this.extendParent(cell);
        }

        // Additionally constrains the child after extending the parent
        if (!constrain || constrain) {
          this.constrainChild(cell);
        }

        // Sets the source terminal
        if (source) {
          this.cellConnected(cell, source, true);
        }

        // Sets the target terminal
        if (target) {
          this.cellConnected(cell, target, false);
        }
        /*}*/
      });

      this.fireEvent(
        new EventObject(InternalEvent.CELLS_ADDED, {
          cells,
          parent,
          index,
          source,
          target,
          absolute,
        })
      );
    });
  },

  autoSizeCell(cell, recurse = true) {
    if (recurse) {
      for (const child of cell.getChildren()) {
        this.autoSizeCell(child);
      }
    }

    if (cell.isVertex() && this.isAutoSizeCell(cell)) {
      this.updateCellSize(cell);
    }
  },

  removeCells(cells = null, includeEdges = true) {
    if (!cells) {
      cells = this.getDeletableCells(this.getSelectionCells());
    }

    // Adds all edges to the cells
    if (includeEdges) {
      // FIXME: Remove duplicate cells in result or do not add if
      // in cells or descendant of cells
      cells = this.getDeletableCells(this.addAllEdges(cells));
    } else {
      cells = cells.slice();

      // Removes edges that are currently not
      // visible as those cannot be updated
      const edges = this.getDeletableCells(this.getAllEdges(cells));
      const dict = new Map<Cell, boolean>();

      for (const cell of cells) {
        dict.set(cell, true);
      }

      for (const edge of edges) {
        if (!this.getView().getState(edge) && !dict.get(edge)) {
          dict.set(edge, true);
          cells.push(edge);
        }
      }
    }

    this.batchUpdate(() => {
      this.cellsRemoved(cells as Cell[]);
      this.fireEvent(
        new EventObject(InternalEvent.REMOVE_CELLS, { cells, includeEdges })
      );
    });

    return cells ?? [];
  },

  cellsRemoved(cells) {
    if (cells.length > 0) {
      const { scale } = this.getView();
      const tr = this.getView().translate;

      this.batchUpdate(() => {
        // Creates hashtable for faster lookup
        const dict = new Map<Cell, boolean>();

        for (const cell of cells) {
          dict.set(cell, true);
        }

        for (const cell of cells) {
          // Disconnects edges which are not being removed
          const edges = this.getAllEdges([cell]);

          const disconnectTerminal = (edge: Cell, source: boolean) => {
            let geo = edge.getGeometry();

            if (geo) {
              // Checks if terminal is being removed
              const terminal = edge.getTerminal(source);
              let connected = false;
              let tmp = terminal;

              while (tmp) {
                if (cell === tmp) {
                  connected = true;
                  break;
                }
                tmp = tmp.getParent();
              }

              if (connected) {
                geo = geo.clone();
                const state = this.getView().getState(edge);

                if (state) {
                  const pts = state.absolutePoints;
                  const n = source ? 0 : pts.length - 1;
                  const p = pts[n] as Point;

                  geo.setTerminalPoint(
                    new Point(
                      p.x / scale - tr.x - state.origin.x,
                      p.y / scale - tr.y - state.origin.y
                    ),
                    source
                  );
                } else if (terminal) {
                  // Fallback to center of terminal if routing
                  // points are not available to add new point
                  // KNOWN: Should recurse to find parent offset
                  // of edge for nested groups but invisible edges
                  // should be removed in removeCells step
                  const tstate = this.getView().getState(terminal);

                  if (tstate) {
                    geo.setTerminalPoint(
                      new Point(
                        tstate.getCenterX() / scale - tr.x,
                        tstate.getCenterY() / scale - tr.y
                      ),
                      source
                    );
                  }
                }

                this.getDataModel().setGeometry(edge, geo);
                this.getDataModel().setTerminal(edge, null, source);
              }
            }
          };

          for (const edge of edges) {
            if (!dict.get(edge)) {
              dict.set(edge, true);
              disconnectTerminal(edge, true);
              disconnectTerminal(edge, false);
            }
          }

          this.getDataModel().remove(cell);
        }

        this.fireEvent(new EventObject(InternalEvent.CELLS_REMOVED, { cells }));
      });
    }
  },

  /*****************************************************************************
   * Group: Cell visibility
   *****************************************************************************/

  toggleCells(show = false, cells, includeEdges = true) {
    cells = cells ?? this.getSelectionCells();

    // Adds all connected edges recursively
    if (includeEdges) {
      cells = this.addAllEdges(cells);
    }

    this.batchUpdate(() => {
      this.cellsToggled(cells, show);
      this.fireEvent(
        new EventObject(InternalEvent.TOGGLE_CELLS, { show, cells, includeEdges })
      );
    });
    return cells;
  },

  cellsToggled(cells, show = false) {
    if (cells.length > 0) {
      this.batchUpdate(() => {
        for (const cell of cells) {
          this.getDataModel().setVisible(cell, show);
        }
      });
    }
  },

  /*****************************************************************************
   * Group: Cell sizing
   *****************************************************************************/

  updateCellSize(cell, ignoreChildren = false) {
    this.batchUpdate(() => {
      this.cellSizeUpdated(cell, ignoreChildren);
      this.fireEvent(
        new EventObject(InternalEvent.UPDATE_CELL_SIZE, { cell, ignoreChildren })
      );
    });
    return cell;
  },

  cellSizeUpdated(cell, ignoreChildren = false) {
    this.batchUpdate(() => {
      const size = this.getPreferredSizeForCell(cell);
      let geo = cell.getGeometry();

      if (size && geo) {
        const collapsed = cell.isCollapsed();
        geo = geo.clone();

        if (this.isSwimlane(cell)) {
          const style = this.getCellStyle(cell);
          const cellStyle = cell.getStyle();

          if (style.horizontal ?? true) {
            cellStyle.startSize = size.height + 8;

            if (collapsed) {
              geo.height = size.height + 8;
            }

            geo.width = size.width;
          } else {
            cellStyle.startSize = size.width + 8;

            if (collapsed) {
              geo.width = size.width + 8;
            }

            geo.height = size.height;
          }

          this.getDataModel().setStyle(cell, cellStyle);
        } else {
          const state = this.getView().createState(cell);
          const align = state.style.align ?? 'center';

          if (align === 'right') {
            geo.x += geo.width - size.width;
          } else if (align === 'center') {
            geo.x += Math.round((geo.width - size.width) / 2);
          }

          const valign = state.getVerticalAlign();

          if (valign === 'bottom') {
            geo.y += geo.height - size.height;
          } else if (valign === 'middle') {
            geo.y += Math.round((geo.height - size.height) / 2);
          }

          geo.width = size.width;
          geo.height = size.height;
        }

        if (!ignoreChildren && !collapsed) {
          const bounds = this.getView().getBounds(cell.getChildren());

          if (bounds != null) {
            const tr = this.getView().translate;
            const { scale } = this.getView();

            const width = (bounds.x + bounds.width) / scale - geo.x - tr.x;
            const height = (bounds.y + bounds.height) / scale - geo.y - tr.y;

            geo.width = Math.max(geo.width, width);
            geo.height = Math.max(geo.height, height);
          }
        }

        this.cellsResized([cell], [geo], false);
      }
    });
  },

  getPreferredSizeForCell(cell, textWidth = null) {
    let result = null;

    const state = this.getView().createState(cell);
    const { style } = state;

    if (!cell.isEdge()) {
      const fontSize = style.fontSize || DEFAULT_FONTSIZE;
      let dx = 0;
      let dy = 0;

      // Adds dimension of image if shape is a label
      if (state.getImageSrc() || style.image) {
        if (style.shape === 'label') {
          if (style.verticalAlign === 'middle') {
            dx += style.imageWidth || DEFAULT_IMAGESIZE;
          }

          if (style.align !== 'center') {
            dy += style.imageHeight || DEFAULT_IMAGESIZE;
          }
        }
      }

      // Adds spacings
      dx += 2 * (style.spacing || 0);
      dx += style.spacingLeft || 0;
      dx += style.spacingRight || 0;

      dy += 2 * (style.spacing || 0);
      dy += style.spacingTop || 0;
      dy += style.spacingBottom || 0;

      // Add spacing for collapse/expand icon
      // LATER: Check alignment and use constants
      // for image spacing
      const image = this.getFoldingImage(state);

      if (image) {
        dx += image.width + 8;
      }

      // Adds space for label
      let value = <string>this.getCellRenderer().getLabelValue(state);

      if (value && value.length > 0) {
        if (!this.isHtmlLabel(state.cell)) {
          value = htmlEntities(value, false);
        }

        value = value.replace(/\n/g, '<br>');

        const size = getSizeForString(
          value,
          fontSize,
          style.fontFamily,
          textWidth,
          style.fontStyle
        );
        let width = size.width + dx;
        let height = size.height + dy;

        if (!(style.horizontal ?? true)) {
          const tmp = height;
          height = width;
          width = tmp;
        }

        if (this.isGridEnabled()) {
          width = this.snap(width + this.getGridSize() / 2);
          height = this.snap(height + this.getGridSize() / 2);
        }

        result = new Rectangle(0, 0, width, height);
      } else {
        const gs2 = 4 * this.getGridSize();
        result = new Rectangle(0, 0, gs2, gs2);
      }
    }

    return result;
  },

  resizeCell(cell, bounds, recurse = false) {
    return this.resizeCells([cell], [bounds], recurse)[0];
  },

  resizeCells(cells, bounds, recurse): Cell[] {
    recurse = recurse ?? this.isRecursiveResize();

    this.batchUpdate(() => {
      const prev = this.cellsResized(cells, bounds, recurse);
      this.fireEvent(
        new EventObject(InternalEvent.RESIZE_CELLS, { cells, bounds, prev })
      );
    });
    return cells;
  },

  cellsResized(cells, bounds, recurse = false) {
    const prev: (Geometry | null)[] = [];

    if (cells.length === bounds.length) {
      this.batchUpdate(() => {
        cells.forEach((cell, i) => {
          prev.push(this.cellResized(cell, bounds[i], false, recurse));

          if (this.isExtendParent(cell)) {
            this.extendParent(cell);
          }

          this.constrainChild(cell);
        });

        if (this.isResetEdgesOnResize()) {
          this.resetEdges(cells);
        }

        this.fireEvent(
          new EventObject(InternalEvent.CELLS_RESIZED, { cells, bounds, prev })
        );
      });
    }
    return prev;
  },

  cellResized(cell, bounds, ignoreRelative = false, recurse = false) {
    const prev = cell.getGeometry();

    if (
      prev &&
      (prev.x !== bounds.x ||
        prev.y !== bounds.y ||
        prev.width !== bounds.width ||
        prev.height !== bounds.height)
    ) {
      const geo = prev.clone();

      if (!ignoreRelative && geo.relative) {
        const { offset } = geo;

        if (offset) {
          offset.x += bounds.x - geo.x;
          offset.y += bounds.y - geo.y;
        }
      } else {
        geo.x = bounds.x;
        geo.y = bounds.y;
      }

      geo.width = bounds.width;
      geo.height = bounds.height;

      if (!geo.relative && cell.isVertex() && !this.isAllowNegativeCoordinates()) {
        geo.x = Math.max(0, geo.x);
        geo.y = Math.max(0, geo.y);
      }

      this.batchUpdate(() => {
        if (recurse) {
          this.resizeChildCells(cell, geo);
        }

        this.getDataModel().setGeometry(cell, geo);
        this.constrainChildCells(cell);
      });
    }

    return prev;
  },

  resizeChildCells(cell, newGeo) {
    const geo = cell.getGeometry();

    if (geo) {
      const dx = geo.width !== 0 ? newGeo.width / geo.width : 1;
      const dy = geo.height !== 0 ? newGeo.height / geo.height : 1;

      for (const child of cell.getChildren()) {
        this.scaleCell(child, dx, dy, true);
      }
    }
  },

  constrainChildCells(cell) {
    for (const child of cell.getChildren()) {
      this.constrainChild(child);
    }
  },

  scaleCell(cell, dx, dy, recurse = false) {
    let geo = cell.getGeometry();

    if (geo) {
      const style = this.getCurrentCellStyle(cell);
      geo = geo.clone();

      // Stores values for restoring based on style
      const { x } = geo;
      const { y } = geo;
      const w = geo.width;
      const h = geo.height;

      geo.scale(dx, dy, style.aspect === 'fixed');

      if (style.resizeWidth) {
        geo.width = w * dx;
      } else if (!style.resizeWidth) {
        geo.width = w;
      }

      if (style.resizeHeight) {
        geo.height = h * dy;
      } else if (!style.resizeHeight) {
        geo.height = h;
      }

      if (!this.isCellMovable(cell)) {
        geo.x = x;
        geo.y = y;
      }

      if (!this.isCellResizable(cell)) {
        geo.width = w;
        geo.height = h;
      }

      if (cell.isVertex()) {
        this.cellResized(cell, geo, true, recurse);
      } else {
        this.getDataModel().setGeometry(cell, geo);
      }
    }
  },

  extendParent(cell) {
    const parent = cell.getParent();
    let p = parent ? parent.getGeometry() : null;

    if (parent && p && !parent.isCollapsed()) {
      const geo = cell.getGeometry();

      if (
        geo &&
        !geo.relative &&
        (p.width < geo.x + geo.width || p.height < geo.y + geo.height)
      ) {
        p = p.clone();

        p.width = Math.max(p.width, geo.x + geo.width);
        p.height = Math.max(p.height, geo.y + geo.height);

        this.cellsResized([parent], [p], false);
      }
    }
  },

  // *************************************************************************************
  // Group: Cell moving
  // *************************************************************************************

  importCells(cells, dx?: number, dy?: number, target = null, evt = null, mapping = {}) {
    return this.moveCells(cells, dx, dy, true, target, evt, mapping);
  },

  moveCells(
    cells,
    dx = 0,
    dy = 0,
    clone = false,
    target = null,
    evt = null,
    mapping = {}
  ) {
    if (dx !== 0 || dy !== 0 || clone || target) {
      // Removes descendants with ancestors in cells to avoid multiple moving
      cells = getTopmostCells(cells);
      const origCells = cells;

      this.batchUpdate(() => {
        // Faster cell lookups to remove relative edge labels with selected
        // terminals to avoid explicit and implicit move at same time
        const dict = new Map<Cell, boolean>();

        for (const cell of cells) {
          dict.set(cell, true);
        }

        const isSelected = (cell: Cell | null) => {
          while (cell) {
            if (dict.get(cell)) {
              return true;
            }
            cell = cell.getParent();
          }
          return false;
        };

        // Removes relative edge labels with selected terminals
        const checked = [];

        for (const cell of cells) {
          const geo = cell.getGeometry();
          const parent = cell.getParent();

          if (
            !geo ||
            !geo.relative ||
            (parent && !parent.isEdge()) ||
            (parent &&
              !isSelected(parent.getTerminal(true)) &&
              !isSelected(parent.getTerminal(false)))
          ) {
            checked.push(cell);
          }
        }

        cells = checked;

        if (clone) {
          cells = this.cloneCells(cells, this.isCloneInvalidEdges(), mapping);

          if (!target) {
            target = this.getDefaultParent();
          }
        }

        // FIXME: Cells should always be inserted first before any other edit
        // to avoid forward references in sessions.
        // Need to disable allowNegativeCoordinates if target not null to
        // allow for temporary negative numbers until cellsAdded is called.
        const previous = this.isAllowNegativeCoordinates();

        if (target) {
          this.setAllowNegativeCoordinates(true);
        }

        this.cellsMoved(
          cells,
          dx,
          dy,
          !clone && this.isDisconnectOnMove() && this.isAllowDanglingEdges(),
          !target,
          this.isExtendParentsOnMove() && !target
        );

        this.setAllowNegativeCoordinates(previous);

        if (target) {
          const index = target.getChildCount();
          this.cellsAdded(cells, target, index, null, null, true);

          // Restores parent edge on cloned edge labels
          if (clone) {
            cells.forEach((cell, i) => {
              const geo = cell.getGeometry();
              const parent = origCells[i].getParent();

              if (
                geo &&
                geo.relative &&
                parent &&
                parent.isEdge() &&
                this.getDataModel().contains(parent)
              ) {
                this.getDataModel().add(parent, cell);
              }
            });
          }
        }

        // Dispatches a move event
        this.fireEvent(
          new EventObject(InternalEvent.MOVE_CELLS, {
            cells,
            dx,
            dy,
            clone,
            target,
            event: evt,
          })
        );
      });
    }
    return cells;
  },

  cellsMoved(cells, dx, dy, disconnect = false, constrain = false, extend = false) {
    if (dx !== 0 || dy !== 0) {
      this.batchUpdate(() => {
        if (disconnect) {
          this.disconnectGraph(cells);
        }

        for (const cell of cells) {
          this.translateCell(cell, dx, dy);

          if (extend && this.isExtendParent(cell)) {
            this.extendParent(cell);
          } else if (constrain) {
            this.constrainChild(cell);
          }
        }

        if (this.isResetEdgesOnMove()) {
          this.resetEdges(cells);
        }

        this.fireEvent(
          new EventObject(InternalEvent.CELLS_MOVED, { cells, dx, dy, disconnect })
        );
      });
    }
  },

  translateCell(cell, dx, dy) {
    let geometry = cell.getGeometry();

    if (geometry) {
      geometry = geometry.clone();
      geometry.translate(dx, dy);

      if (!geometry.relative && cell.isVertex() && !this.isAllowNegativeCoordinates()) {
        geometry.x = Math.max(0, geometry.x);
        geometry.y = Math.max(0, geometry.y);
      }

      if (geometry.relative && !cell.isEdge()) {
        const parent = <Cell>cell.getParent();
        let angle = 0;

        if (parent.isVertex()) {
          const style = this.getCurrentCellStyle(parent);
          angle = style.rotation ?? 0;
        }

        if (angle !== 0) {
          const rad = toRadians(-angle);
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const pt = getRotatedPoint(new Point(dx, dy), cos, sin, new Point(0, 0));
          dx = pt.x;
          dy = pt.y;
        }

        if (!geometry.offset) {
          geometry.offset = new Point(dx, dy);
        } else {
          geometry.offset.x = geometry.offset.x + dx;
          geometry.offset.y = geometry.offset.y + dy;
        }
      }
      this.getDataModel().setGeometry(cell, geometry);
    }
  },

  getCellContainmentArea(cell) {
    if (!cell.isEdge()) {
      const parent = cell.getParent();

      if (parent && parent !== this.getDefaultParent()) {
        const g = parent.getGeometry();

        if (g) {
          let x = 0;
          let y = 0;
          let w = g.width;
          let h = g.height;

          if (this.isSwimlane(parent)) {
            const size = this.getStartSize(parent);
            const style = this.getCurrentCellStyle(parent);
            const dir = style.direction ?? 'east';
            const flipH = style.flipH ?? false;
            const flipV = style.flipV ?? false;

            if (dir === 'south' || dir === 'north') {
              const tmp = size.width;
              size.width = size.height;
              size.height = tmp;
            }

            if (
              (dir === 'east' && !flipV) ||
              (dir === 'north' && !flipH) ||
              (dir === 'west' && flipV) ||
              (dir === 'south' && flipH)
            ) {
              x = size.width;
              y = size.height;
            }

            w -= size.width;
            h -= size.height;
          }

          return new Rectangle(x, y, w, h);
        }
      }
    }
    return null;
  },

  constrainChild(cell, sizeFirst = true) {
    let geo = cell.getGeometry();

    if (geo && (this.isConstrainRelativeChildren() || !geo.relative)) {
      const parent = cell.getParent();
      let max = this.getMaximumGraphBounds();

      // Finds parent offset
      if (max && parent) {
        const off = this.getBoundingBoxFromGeometry([parent], false);

        if (off) {
          max = Rectangle.fromRectangle(max);

          max.x -= off.x;
          max.y -= off.y;
        }
      }

      if (this.isConstrainChild(cell)) {
        let tmp = this.getCellContainmentArea(cell);

        if (tmp) {
          const overlap = this.getOverlap(cell);

          if (overlap > 0) {
            tmp = Rectangle.fromRectangle(tmp);

            tmp.x -= tmp.width * overlap;
            tmp.y -= tmp.height * overlap;
            tmp.width += 2 * tmp.width * overlap;
            tmp.height += 2 * tmp.height * overlap;
          }

          // Find the intersection between max and tmp
          if (!max) {
            max = tmp;
          } else {
            max = Rectangle.fromRectangle(max);
            max.intersect(tmp);
          }
        }
      }

      if (max) {
        const cells = [cell];

        if (!cell.isCollapsed()) {
          const desc = cell.getDescendants();

          for (const descItem of desc) {
            if (descItem.isVisible()) {
              cells.push(descItem);
            }
          }
        }

        const bbox = this.getBoundingBoxFromGeometry(cells, false);

        if (bbox) {
          geo = geo.clone();

          // Cumulative horizontal movement
          let dx = 0;

          if (geo.width > max.width) {
            dx = geo.width - max.width;
            geo.width -= dx;
          }

          if (bbox.x + bbox.width > max.x + max.width) {
            dx -= bbox.x + bbox.width - max.x - max.width - dx;
          }

          // Cumulative vertical movement
          let dy = 0;

          if (geo.height > max.height) {
            dy = geo.height - max.height;
            geo.height -= dy;
          }

          if (bbox.y + bbox.height > max.y + max.height) {
            dy -= bbox.y + bbox.height - max.y - max.height - dy;
          }

          if (bbox.x < max.x) {
            dx -= bbox.x - max.x;
          }

          if (bbox.y < max.y) {
            dy -= bbox.y - max.y;
          }

          if (dx !== 0 || dy !== 0) {
            if (geo.relative) {
              // Relative geometries are moved via absolute offset
              if (!geo.offset) {
                geo.offset = new Point();
              }

              geo.offset.x += dx;
              geo.offset.y += dy;
            } else {
              geo.x += dx;
              geo.y += dy;
            }
          }
          this.getDataModel().setGeometry(cell, geo);
        }
      }
    }
  },

  /*****************************************************************************
   * Group: Cell retrieval
   *****************************************************************************/

  getChildCells(parent, vertices = false, edges = false) {
    parent = parent ?? this.getDefaultParent();

    const cells = parent.getChildCells(vertices, edges);
    const result = [];

    // Filters out the non-visible child cells
    for (const cell of cells) {
      if (cell.isVisible()) {
        result.push(cell);
      }
    }
    return result;
  },

  getCellAt(x, y, parent = null, vertices = true, edges = true, ignoreFn = null) {
    if (!parent) {
      parent = this.getCurrentRoot();

      if (!parent) {
        parent = this.getDataModel().getRoot();
      }
    }

    if (parent) {
      const childCount = parent.getChildCount();

      for (let i = childCount - 1; i >= 0; i--) {
        const cell = parent.getChildAt(i);
        const result = this.getCellAt(x, y, cell, vertices, edges, ignoreFn);

        if (result) {
          return result;
        }
        if (
          cell.isVisible() &&
          ((edges && cell.isEdge()) || (vertices && cell.isVertex()))
        ) {
          const state = this.getView().getState(cell);

          if (
            state &&
            (!ignoreFn || !ignoreFn(state, x, y)) &&
            this.intersects(state, x, y)
          ) {
            return cell;
          }
        }
      }
    }
    return null;
  },

  getCells(
    x,
    y,
    width,
    height,
    parent = null,
    result = [],
    intersection = null,
    ignoreFn = null,
    includeDescendants = false
  ) {
    if (width > 0 || height > 0 || intersection) {
      const model = this.getDataModel();
      const right = x + width;
      const bottom = y + height;

      if (!parent) {
        parent = this.getCurrentRoot();

        if (!parent) {
          parent = model.getRoot();
        }
      }

      if (parent) {
        for (const cell of parent.getChildren()) {
          const state = this.getView().getState(cell);

          if (state && cell.isVisible() && (!ignoreFn || !ignoreFn(state))) {
            const deg = state.style.rotation ?? 0;

            let box: CellState | Rectangle = state; // TODO: CHECK ME!!!! ==========================================================
            if (deg !== 0) {
              box = <Rectangle>getBoundingBox(box, deg);
            }

            const hit =
              (intersection && cell.isVertex() && intersects(intersection, box)) ||
              (!intersection &&
                (cell.isEdge() || cell.isVertex()) &&
                box.x >= x &&
                box.y + box.height <= bottom &&
                box.y >= y &&
                box.x + box.width <= right);

            if (hit) {
              result.push(cell);
            }

            if (!hit || includeDescendants) {
              this.getCells(
                x,
                y,
                width,
                height,
                cell,
                result,
                intersection,
                ignoreFn,
                includeDescendants
              );
            }
          }
        }
      }
    }
    return result;
  },

  getCellsBeyond(x0, y0, parent = null, rightHalfpane = false, bottomHalfpane = false) {
    const result = [];

    if (rightHalfpane || bottomHalfpane) {
      if (!parent) {
        parent = this.getDefaultParent();
      }

      if (parent) {
        for (const child of parent.getChildren()) {
          const state = this.getView().getState(child);
          if (child.isVisible() && state) {
            if ((!rightHalfpane || state.x >= x0) && (!bottomHalfpane || state.y >= y0)) {
              result.push(child);
            }
          }
        }
      }
    }
    return result;
  },

  intersects(state, x, y) {
    const pts = state.absolutePoints;

    if (pts.length > 0) {
      const t2 = this.getEventTolerance() * this.getEventTolerance();
      let pt = pts[0];

      for (let i = 1; i < pts.length; i += 1) {
        const next = pts[i];

        if (pt && next) {
          const dist = ptSegDistSq(pt.x, pt.y, next.x, next.y, x, y);

          if (dist <= t2) {
            return true;
          }
        }

        pt = next;
      }
    } else {
      const alpha = toRadians(state.style.rotation ?? 0);

      if (alpha !== 0) {
        const cos = Math.cos(-alpha);
        const sin = Math.sin(-alpha);
        const cx = new Point(state.getCenterX(), state.getCenterY());
        const pt = getRotatedPoint(new Point(x, y), cos, sin, cx);
        x = pt.x;
        y = pt.y;
      }

      if (contains(state, x, y)) {
        return true;
      }
    }
    return false;
  },

  isValidAncestor(cell, parent, recurse = false) {
    return recurse ? parent.isAncestor(cell) : cell?.getParent() === parent;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  isCellLocked(cell) {
    const geometry = cell.getGeometry();

    return this.isCellsLocked() || (!!geometry && cell.isVertex() && geometry.relative);
  },

  isCellsLocked() {
    return this.cellsLocked;
  },

  setCellsLocked(value) {
    this.cellsLocked = value;
  },

  getCloneableCells(cells) {
    return this.getDataModel().filterCells(cells, (cell: Cell) => {
      return this.isCellCloneable(cell);
    });
  },

  isCellCloneable(cell) {
    return this.isCellsCloneable() && (this.getCurrentCellStyle(cell).cloneable ?? true);
  },

  isCellsCloneable() {
    return this.cellsCloneable;
  },

  setCellsCloneable(value) {
    this.cellsCloneable = value;
  },

  getExportableCells(cells) {
    return this.getDataModel().filterCells(cells, (cell: Cell) => {
      return this.canExportCell(cell);
    });
  },

  canExportCell(_cell = null) {
    return this.isExportEnabled();
  },

  getImportableCells(cells) {
    return this.getDataModel().filterCells(cells, (cell: Cell) => {
      return this.canImportCell(cell);
    });
  },

  canImportCell(cell = null) {
    return this.isImportEnabled();
  },

  isCellSelectable(_cell) {
    return this.isCellsSelectable();
  },

  isCellsSelectable() {
    return this.cellsSelectable;
  },

  setCellsSelectable(value) {
    this.cellsSelectable = value;
  },

  getDeletableCells(cells) {
    return this.getDataModel().filterCells(cells, (cell: Cell) => {
      return this.isCellDeletable(cell);
    });
  },

  isCellDeletable(cell) {
    return this.isCellsDeletable() && (this.getCurrentCellStyle(cell).deletable ?? true);
  },

  isCellsDeletable() {
    return this.cellsDeletable;
  },

  setCellsDeletable(value) {
    this.cellsDeletable = value;
  },

  isCellRotatable(cell) {
    return this.getCurrentCellStyle(cell).rotatable ?? true;
  },

  getMovableCells(cells) {
    return this.getDataModel().filterCells(cells, (cell: Cell) => {
      return this.isCellMovable(cell);
    });
  },

  isCellMovable(cell) {
    return (
      this.isCellsMovable() &&
      !this.isCellLocked(cell) &&
      (this.getCurrentCellStyle(cell).movable ?? true)
    );
  },

  isCellsMovable() {
    return this.cellsMovable;
  },

  setCellsMovable(value) {
    this.cellsMovable = value;
  },

  isCellResizable(cell) {
    return (
      this.isCellsResizable() &&
      !this.isCellLocked(cell) &&
      (this.getCurrentCellStyle(cell).resizable ?? true)
    );
  },

  isCellsResizable() {
    return this.cellsResizable;
  },

  setCellsResizable(value) {
    this.cellsResizable = value;
  },

  isCellBendable(cell) {
    return (
      this.isCellsBendable() &&
      !this.isCellLocked(cell) &&
      (this.getCurrentCellStyle(cell).bendable ?? true)
    );
  },

  isCellsBendable() {
    return this.cellsBendable;
  },

  setCellsBendable(value) {
    this.cellsBendable = value;
  },

  isAutoSizeCell(cell) {
    return this.isAutoSizeCells() || (this.getCurrentCellStyle(cell).autoSize ?? false);
  },

  isAutoSizeCells() {
    return this.autoSizeCells;
  },

  setAutoSizeCells(value) {
    this.autoSizeCells = value;
  },

  isExtendParent(cell) {
    return !cell.isEdge() && this.isExtendParents();
  },

  isExtendParents() {
    return this.extendParents;
  },

  setExtendParents(value) {
    this.extendParents = value;
  },

  isExtendParentsOnAdd(cell) {
    return this.extendParentsOnAdd;
  },

  setExtendParentsOnAdd(value) {
    this.extendParentsOnAdd = value;
  },

  isExtendParentsOnMove() {
    return this.extendParentsOnMove;
  },

  setExtendParentsOnMove(value) {
    this.extendParentsOnMove = value;
  },

  /*****************************************************************************
   * Group: Graph appearance
   *****************************************************************************/

  getCursorForCell(_cell) {
    return null;
  },

  /*****************************************************************************
   * Group: Graph display
   *****************************************************************************/

  getCellBounds(cell, includeEdges = false, includeDescendants = false) {
    let cells = [cell];

    // Includes all connected edges
    if (includeEdges) {
      cells = cells.concat(cell.getEdges());
    }

    let result = this.getView().getBounds(cells);

    // Recursively includes the bounds of the children
    if (includeDescendants) {
      for (const child of cell.getChildren()) {
        const tmp = this.getCellBounds(child, includeEdges, true);

        if (result && tmp) {
          result.add(tmp);
        } else {
          result = tmp;
        }
      }
    }
    return result;
  },

  getBoundingBoxFromGeometry(cells, includeEdges = false) {
    let result = null;
    let tmp: Rectangle | null = null;

    for (const cell of cells) {
      if (includeEdges || cell.isVertex()) {
        // Computes the bounding box for the points in the geometry
        const geo = cell.getGeometry();
        if (geo) {
          let bbox = null;

          if (cell.isEdge()) {
            const addPoint = (pt: Point | null) => {
              if (pt) {
                if (!tmp) {
                  tmp = new Rectangle(pt.x, pt.y, 0, 0);
                } else {
                  tmp.add(new Rectangle(pt.x, pt.y, 0, 0));
                }
              }
            };

            if (!cell.getTerminal(true)) {
              addPoint(geo.getTerminalPoint(true));
            }

            if (!cell.getTerminal(false)) {
              addPoint(geo.getTerminalPoint(false));
            }

            const pts = geo.points;

            if (pts && pts.length > 0) {
              tmp = new Rectangle(pts[0].x, pts[0].y, 0, 0);

              for (let j = 1; j < pts.length; j++) {
                addPoint(pts[j]);
              }
            }

            bbox = tmp;
          } else {
            const parent = cell.getParent();

            if (geo.relative && parent) {
              if (parent.isVertex() && parent !== this.getView().currentRoot) {
                tmp = this.getBoundingBoxFromGeometry([parent], false);

                if (tmp) {
                  bbox = new Rectangle(
                    geo.x * tmp.width,
                    geo.y * tmp.height,
                    geo.width,
                    geo.height
                  );

                  if (cells.includes(parent)) {
                    bbox.x += tmp.x;
                    bbox.y += tmp.y;
                  }
                }
              }
            } else {
              bbox = Rectangle.fromRectangle(geo);

              if (parent && parent.isVertex() && cells.includes(parent)) {
                tmp = this.getBoundingBoxFromGeometry([parent], false);

                if (tmp) {
                  bbox.x += tmp.x;
                  bbox.y += tmp.y;
                }
              }
            }

            if (bbox && geo.offset) {
              bbox.x += geo.offset.x;
              bbox.y += geo.offset.y;
            }

            const style = this.getCurrentCellStyle(cell);
            if (bbox) {
              const angle = style.rotation ?? 0;
              if (angle !== 0) {
                bbox = getBoundingBox(bbox, angle);
              }
            }
          }

          if (bbox) {
            if (!result) {
              result = Rectangle.fromRectangle(bbox);
            } else {
              result.add(bbox);
            }
          }
        }
      }
    }
    return result;
  },
};
