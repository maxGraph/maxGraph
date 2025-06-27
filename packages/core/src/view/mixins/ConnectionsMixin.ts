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

import Point from '../geometry/Point';
import ConnectionConstraint from '../other/ConnectionConstraint';
import { getRotatedPoint, toRadians } from '../../util/mathUtils';
import Cell from '../cell/Cell';
import EventObject from '../event/EventObject';
import InternalEvent from '../event/InternalEvent';
import type { AbstractGraph } from '../AbstractGraph';
import type ConnectionHandler from '../plugins/ConnectionHandler';

type PartialGraph = Pick<AbstractGraph, 'getView' | 'getDataModel' | 'isPortsEnabled'>;
type PartialConnections = Pick<
  AbstractGraph,
  | 'constrainChildren'
  | 'constrainRelativeChildren'
  | 'disconnectOnMove'
  | 'cellsDisconnectable'
  | 'getOutlineConstraint'
  | 'getAllConnectionConstraints'
  | 'getConnectionConstraint'
  | 'setConnectionConstraint'
  | 'getConnectionPoint'
  | 'connectCell'
  | 'cellConnected'
  | 'disconnectGraph'
  | 'getConnections'
  | 'isConstrainChild'
  | 'isConstrainChildren'
  | 'setConstrainChildren'
  | 'isConstrainRelativeChildren'
  | 'setConstrainRelativeChildren'
  | 'isDisconnectOnMove'
  | 'setDisconnectOnMove'
  | 'isCellDisconnectable'
  | 'isCellsDisconnectable'
  | 'setCellsDisconnectable'
  | 'isValidSource'
  | 'isValidTarget'
  | 'isValidConnection'
  | 'setConnectable'
  | 'isConnectable'
  | 'setCellStyles'
  | 'fireEvent'
  | 'isPort'
  | 'getTerminalForPort'
  | 'isResetEdgesOnConnect'
  | 'resetEdge'
  | 'getEdges'
  | 'isCellLocked'
  | 'isAllowDanglingEdges'
  | 'isConnectableEdges'
  | 'getPlugin'
  | 'batchUpdate'
>;
type PartialType = PartialGraph & PartialConnections;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const ConnectionsMixin: PartialType = {
  /*****************************************************************************
   * Group: Cell connecting and connection constraints
   *****************************************************************************/

  constrainChildren: true,

  constrainRelativeChildren: false,

  disconnectOnMove: true,

  cellsDisconnectable: true,

  getOutlineConstraint(point, terminalState, me) {
    if (terminalState.shape) {
      const bounds = this.getView().getPerimeterBounds(terminalState);
      const direction = terminalState.style.direction;

      if (direction === 'north' || direction === 'south') {
        bounds.x += bounds.width / 2 - bounds.height / 2;
        bounds.y += bounds.height / 2 - bounds.width / 2;
        const tmp = bounds.width;
        bounds.width = bounds.height;
        bounds.height = tmp;
      }

      const alpha = toRadians(terminalState.shape.getShapeRotation());
      if (alpha !== 0) {
        const cos = Math.cos(-alpha);
        const sin = Math.sin(-alpha);

        const ct = new Point(bounds.getCenterX(), bounds.getCenterY());
        point = getRotatedPoint(point, cos, sin, ct);
      }

      let sx = 1;
      let sy = 1;
      let dx = 0;
      let dy = 0;

      // LATER: Add flipping support for image shapes
      if (terminalState.cell.isVertex()) {
        let flipH = terminalState.style.flipH;
        let flipV = terminalState.style.flipV;

        if (direction === 'north' || direction === 'south') {
          const tmp = flipH;
          flipH = flipV;
          flipV = tmp;
        }

        if (flipH) {
          sx = -1;
          dx = -bounds.width;
        }

        if (flipV) {
          sy = -1;
          dy = -bounds.height;
        }
      }

      point = new Point(
        (point.x - bounds.x) * sx - dx + bounds.x,
        (point.y - bounds.y) * sy - dy + bounds.y
      );

      const x =
        bounds.width === 0
          ? 0
          : Math.round(((point.x - bounds.x) * 1000) / bounds.width) / 1000;
      const y =
        bounds.height === 0
          ? 0
          : Math.round(((point.y - bounds.y) * 1000) / bounds.height) / 1000;

      return new ConnectionConstraint(new Point(x, y), false);
    }
    return null;
  },

  getAllConnectionConstraints(terminal, _source) {
    return terminal?.shape?.stencil?.constraints ?? null;
  },

  getConnectionConstraint(edge, terminal, source = false) {
    let point: Point | null = null;
    const x = edge.style[source ? 'exitX' : 'entryX'];

    if (x !== undefined) {
      const y = edge.style[source ? 'exitY' : 'entryY'];

      if (y !== undefined) {
        point = new Point(x, y);
      }
    }

    let perimeter = false;
    let dx = 0;
    let dy = 0;

    if (point) {
      perimeter = edge.style[source ? 'exitPerimeter' : 'entryPerimeter'] || false;

      // Add entry/exit offset
      dx = <number>edge.style[source ? 'exitDx' : 'entryDx'];
      dy = <number>edge.style[source ? 'exitDy' : 'entryDy'];

      dx = Number.isFinite(dx) ? dx : 0;
      dy = Number.isFinite(dy) ? dy : 0;
    }
    return new ConnectionConstraint(point, perimeter, null, dx, dy);
  },

  setConnectionConstraint(edge, terminal, source = false, constraint = null) {
    if (constraint) {
      this.batchUpdate(() => {
        if (!constraint || !constraint.point) {
          this.setCellStyles(source ? 'exitX' : 'entryX', null, [edge]);
          this.setCellStyles(source ? 'exitY' : 'entryY', null, [edge]);
          this.setCellStyles(source ? 'exitDx' : 'entryDx', null, [edge]);
          this.setCellStyles(source ? 'exitDy' : 'entryDy', null, [edge]);
          this.setCellStyles(source ? 'exitPerimeter' : 'entryPerimeter', null, [edge]);
        } else if (constraint.point) {
          this.setCellStyles(source ? 'exitX' : 'entryX', constraint.point.x, [edge]);
          this.setCellStyles(source ? 'exitY' : 'entryY', constraint.point.y, [edge]);
          this.setCellStyles(source ? 'exitDx' : 'entryDx', constraint.dx, [edge]);
          this.setCellStyles(source ? 'exitDy' : 'entryDy', constraint.dy, [edge]);

          // Only writes 0 since 1 is default
          if (!constraint.perimeter) {
            this.setCellStyles(source ? 'exitPerimeter' : 'entryPerimeter', '0', [edge]);
          } else {
            this.setCellStyles(source ? 'exitPerimeter' : 'entryPerimeter', null, [edge]);
          }
        }
      });
    }
  },

  getConnectionPoint(vertex, constraint, round = true) {
    let point: Point | null = null;

    if (constraint.point) {
      const bounds = this.getView().getPerimeterBounds(vertex);
      const cx = new Point(bounds.getCenterX(), bounds.getCenterY());
      const direction = vertex.style.direction;
      let r1 = 0;

      // Bounds need to be rotated by 90 degrees for further computation
      if (vertex.style.anchorPointDirection) {
        if (direction === 'north') {
          r1 += 270;
        } else if (direction === 'west') {
          r1 += 180;
        } else if (direction === 'south') {
          r1 += 90;
        }

        // Bounds need to be rotated by 90 degrees for further computation
        if (direction === 'north' || direction === 'south') {
          bounds.rotate90();
        }
      }

      const { scale } = this.getView();
      point = new Point(
        bounds.x + constraint.point.x * bounds.width + <number>constraint.dx * scale,
        bounds.y + constraint.point.y * bounds.height + <number>constraint.dy * scale
      );

      // Rotation for direction before projection on perimeter
      let r2 = vertex.style.rotation || 0;

      if (constraint.perimeter) {
        if (r1 !== 0) {
          // Only 90 degrees steps possible here so no trig needed
          let cos = 0;
          let sin = 0;

          if (r1 === 90) {
            sin = 1;
          } else if (r1 === 180) {
            cos = -1;
          } else if (r1 === 270) {
            sin = -1;
          }

          point = <Point>getRotatedPoint(point, cos, sin, cx);
        }

        point = this.getView().getPerimeterPoint(vertex, point, false);
      } else {
        r2 += r1;

        if (vertex.cell.isVertex()) {
          let flipH = vertex.style.flipH;
          let flipV = vertex.style.flipV;

          if (direction === 'north' || direction === 'south') {
            const temp = flipH;
            flipH = flipV;
            flipV = temp;
          }

          if (flipH) {
            point.x = 2 * bounds.getCenterX() - point.x;
          }

          if (flipV) {
            point.y = 2 * bounds.getCenterY() - point.y;
          }
        }
      }

      // Generic rotation after projection on perimeter
      if (r2 !== 0 && point) {
        const rad = toRadians(r2);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        point = getRotatedPoint(point, cos, sin, cx);
      }
    }

    if (round && point) {
      point.x = Math.round(point.x);
      point.y = Math.round(point.y);
    }
    return point;
  },

  connectCell(edge, terminal = null, source = false, constraint = null) {
    this.batchUpdate(() => {
      const previous = edge.getTerminal(source);
      this.cellConnected(edge, terminal, source, constraint);
      this.fireEvent(
        new EventObject(
          InternalEvent.CONNECT_CELL,
          'edge',
          edge,
          'terminal',
          terminal,
          'source',
          source,
          'previous',
          previous
        )
      );
    });
    return edge;
  },

  cellConnected(edge, terminal, source = false, constraint = null) {
    this.batchUpdate(() => {
      const previous = edge.getTerminal(source);

      // Updates the constraint
      this.setConnectionConstraint(edge, terminal, source, constraint);

      // Checks if the new terminal is a port, uses the ID of the port in the
      // style and the parent of the port as the actual terminal of the edge.
      if (this.isPortsEnabled()) {
        let id = null;

        if (terminal && this.isPort(terminal)) {
          id = terminal.getId();
          terminal = this.getTerminalForPort(terminal, source);
        }

        // Sets or resets all previous information for connecting to a child port
        const key = source ? 'sourcePort' : 'targetPort';
        this.setCellStyles(key, id, [edge]);
      }

      this.getDataModel().setTerminal(edge, terminal, source);

      if (this.isResetEdgesOnConnect()) {
        this.resetEdge(edge);
      }

      this.fireEvent(
        new EventObject(
          InternalEvent.CELL_CONNECTED,
          'edge',
          edge,
          'terminal',
          terminal,
          'source',
          source,
          'previous',
          previous
        )
      );
    });
  },

  disconnectGraph(cells) {
    this.batchUpdate(() => {
      const { scale, translate: tr } = this.getView();

      // Fast lookup for finding cells in array
      const dict = new Map<Cell, boolean>();

      for (let i = 0; i < cells.length; i += 1) {
        dict.set(cells[i], true);
      }

      for (const cell of cells) {
        if (cell.isEdge()) {
          let geo = cell.getGeometry();

          if (geo) {
            const state = this.getView().getState(cell);
            const parent = cell.getParent();
            const pstate = parent ? this.getView().getState(parent) : null;

            if (state && pstate) {
              geo = geo.clone();

              const dx = -pstate.origin.x;
              const dy = -pstate.origin.y;
              const pts = state.absolutePoints;

              let src = cell.getTerminal(true);

              if (src && this.isCellDisconnectable(cell, src, true)) {
                while (src && !dict.get(src)) {
                  src = src.getParent();
                }

                if (!src && pts[0]) {
                  geo.setTerminalPoint(
                    new Point(pts[0].x / scale - tr.x + dx, pts[0].y / scale - tr.y + dy),
                    true
                  );
                  this.getDataModel().setTerminal(cell, null, true);
                }
              }

              let trg = cell.getTerminal(false);

              if (trg && this.isCellDisconnectable(cell, trg, false)) {
                while (trg && !dict.get(trg)) {
                  trg = trg.getParent();
                }

                if (!trg) {
                  const n = pts.length - 1;
                  const p = pts[n];

                  if (p) {
                    geo.setTerminalPoint(
                      new Point(p.x / scale - tr.x + dx, p.y / scale - tr.y + dy),
                      false
                    );
                    this.getDataModel().setTerminal(cell, null, false);
                  }
                }
              }

              this.getDataModel().setGeometry(cell, geo);
            }
          }
        }
      }
    });
  },

  getConnections(cell, parent = null) {
    return this.getEdges(cell, parent, true, true, false);
  },

  isConstrainChild(cell) {
    return (
      this.isConstrainChildren() &&
      !!cell.getParent() &&
      !(<Cell>cell.getParent()).isEdge()
    );
  },

  isConstrainChildren() {
    return this.constrainChildren;
  },

  setConstrainChildren(value) {
    this.constrainChildren = value;
  },

  isConstrainRelativeChildren() {
    return this.constrainRelativeChildren;
  },

  setConstrainRelativeChildren(value) {
    this.constrainRelativeChildren = value;
  },

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  isDisconnectOnMove() {
    return this.disconnectOnMove;
  },

  setDisconnectOnMove(value) {
    this.disconnectOnMove = value;
  },

  isCellDisconnectable(cell, terminal = null, source = false) {
    return this.isCellsDisconnectable() && !this.isCellLocked(cell);
  },

  isCellsDisconnectable() {
    return this.cellsDisconnectable;
  },

  setCellsDisconnectable(value) {
    this.cellsDisconnectable = value;
  },

  isValidSource(cell) {
    return (
      (cell == null && this.isAllowDanglingEdges()) ||
      (cell != null &&
        (!cell.isEdge() || this.isConnectableEdges()) &&
        cell.isConnectable())
    );
  },

  isValidTarget(cell) {
    return this.isValidSource(cell);
  },

  isValidConnection(source, target) {
    return this.isValidSource(source) && this.isValidTarget(target);
  },

  setConnectable(connectable) {
    const connectionHandler = this.getPlugin<ConnectionHandler>('ConnectionHandler');
    connectionHandler?.setEnabled(connectable);
  },

  isConnectable() {
    const connectionHandler = this.getPlugin<ConnectionHandler>('ConnectionHandler');
    return connectionHandler?.isEnabled() ?? false;
  },
};
