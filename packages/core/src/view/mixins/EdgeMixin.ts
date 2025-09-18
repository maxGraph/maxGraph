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

import type { CellStyle } from '../../types.js';
import { removeDuplicates } from '../../util/arrayUtils.js';
import { findNearestSegment } from '../../util/mathUtils.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import Cell from '../cell/Cell.js';
import EventObject from '../event/EventObject.js';
import InternalEvent from '../event/InternalEvent.js';
import Geometry from '../geometry/Geometry.js';
import type Point from '../geometry/Point.js';

type PartialGraph = Pick<
  AbstractGraph,
  | 'alternateEdgeStyle'
  | 'batchUpdate'
  | 'fireEvent'
  | 'getDataModel'
  | 'getView'
  | 'getChildCells'
  | 'isValidAncestor'
  | 'cellsAdded'
  | 'cellsMoved'
  | 'cloneCell'
  | 'addCell'
  | 'cellConnected'
>;
type PartialEdge = Pick<
  AbstractGraph,
  | 'resetEdgesOnResize'
  | 'resetEdgesOnMove'
  | 'resetEdgesOnConnect'
  | 'connectableEdges'
  | 'allowDanglingEdges'
  | 'cloneInvalidEdges'
  | 'edgeLabelsMovable'
  | 'isResetEdgesOnMove'
  | 'isResetEdgesOnConnect'
  | 'isResetEdgesOnResize'
  | 'isEdgeLabelsMovable'
  | 'setEdgeLabelsMovable'
  | 'setAllowDanglingEdges'
  | 'isAllowDanglingEdges'
  | 'setConnectableEdges'
  | 'isConnectableEdges'
  | 'setCloneInvalidEdges'
  | 'isCloneInvalidEdges'
  | 'flipEdge'
  | 'splitEdge'
  | 'createEdge'
  | 'addEdge'
  | 'addAllEdges'
  | 'getAllEdges'
  | 'getIncomingEdges'
  | 'getOutgoingEdges'
  | 'getEdges'
  | 'getChildEdges'
  | 'getEdgesBetween'
  | 'resetEdges'
  | 'resetEdge'
> & {
  // handle the methods defined in the Graph interface with a single implementation
  insertEdge: (...args: any[]) => Cell;
};
type PartialType = PartialGraph & PartialEdge;

// @ts-expect-error The properties of PartialGraph are defined elsewhere.
export const EdgeMixin: PartialType = {
  resetEdgesOnResize: false,

  isResetEdgesOnResize() {
    return this.resetEdgesOnResize;
  },

  resetEdgesOnMove: false,

  isResetEdgesOnMove() {
    return this.resetEdgesOnMove;
  },

  resetEdgesOnConnect: true,

  isResetEdgesOnConnect() {
    return this.resetEdgesOnConnect;
  },

  connectableEdges: false,

  allowDanglingEdges: true,

  cloneInvalidEdges: false,

  edgeLabelsMovable: true,

  // ***************************************************************************
  // Group: Graph Behaviour
  // ***************************************************************************

  isEdgeLabelsMovable() {
    return this.edgeLabelsMovable;
  },

  setEdgeLabelsMovable(value) {
    this.edgeLabelsMovable = value;
  },

  setAllowDanglingEdges(value) {
    this.allowDanglingEdges = value;
  },

  isAllowDanglingEdges() {
    return this.allowDanglingEdges;
  },

  setConnectableEdges(value) {
    this.connectableEdges = value;
  },

  isConnectableEdges() {
    return this.connectableEdges;
  },

  setCloneInvalidEdges(value) {
    this.cloneInvalidEdges = value;
  },

  isCloneInvalidEdges() {
    return this.cloneInvalidEdges;
  },

  // ***************************************************************************
  // Group: Cell alignment and orientation
  // ***************************************************************************

  flipEdge(edge) {
    if (this.alternateEdgeStyle) {
      this.batchUpdate(() => {
        const style = edge.getStyle();

        if (Object.keys(style).length) {
          this.getDataModel().setStyle(edge, this.alternateEdgeStyle);
        } else {
          this.getDataModel().setStyle(edge, {});
        }

        // Removes all existing control points
        this.resetEdge(edge);
        this.fireEvent(new EventObject(InternalEvent.FLIP_EDGE, { edge }));
      });
    }
    return edge;
  },

  splitEdge(edge, cells, newEdge, dx = 0, dy = 0, x, y, parent = null) {
    parent = parent ?? edge.getParent();
    const source = edge.getTerminal(true);

    this.batchUpdate(() => {
      if (!newEdge) {
        newEdge = this.cloneCell(edge);

        // Removes waypoints before/after new cell
        const state = this.getView().getState(edge);
        let geo: Geometry | null = newEdge.getGeometry();

        if (geo && state) {
          const t = this.getView().translate;
          const s = this.getView().scale;
          const idx = findNearestSegment(state, (dx + t.x) * s, (dy + t.y) * s);

          geo.points = (<Point[]>geo.points).slice(0, idx);
          geo = edge.getGeometry();

          if (geo) {
            geo = geo.clone();
            geo.points = (<Point[]>geo.points).slice(idx);
            this.getDataModel().setGeometry(edge, geo);
          }
        }
      }

      this.cellsMoved(cells, dx, dy, false, false);
      this.cellsAdded(
        cells,
        parent as Cell,
        parent ? parent.getChildCount() : 0,
        null,
        null,
        true
      );
      this.cellsAdded(
        [newEdge],
        parent as Cell,
        parent ? parent.getChildCount() : 0,
        source,
        cells[0],
        false
      );
      this.cellConnected(edge, cells[0], true);
      this.fireEvent(
        new EventObject(InternalEvent.SPLIT_EDGE, { edge, cells, newEdge, dx, dy })
      );
    });

    return newEdge as Cell;
  },

  insertEdge(...args) {
    let parent: Cell;
    let id: string;
    let value: any;
    let source: Cell;
    let target: Cell;
    let style: CellStyle;

    if (args.length === 1 && typeof args[0] === 'object') {
      const params = args[0];
      parent = params.parent;
      id = params.id;
      value = params.value;
      source = params.source;
      target = params.target;
      style = params.style;
    } else {
      // otherwise treat as individual arguments
      [parent, id, value, source, target, style] = args;
    }

    const edge = this.createEdge(parent, id, value, source, target, style);
    return this.addEdge(edge, parent, source, target);
  },

  createEdge(
    _parent = null,
    id,
    value,
    _source = null,
    _target = null,
    style: CellStyle = {}
  ) {
    // Creates the edge
    const edge = new Cell(value, new Geometry(), style);
    edge.setId(id!); // this is not an issue to set undefined here. If so, the id will be auto-generated when adding the cell to the model
    edge.setEdge(true);
    edge.geometry!.relative = true; // geometry is set when creating the cell above
    return edge;
  },

  addEdge(edge, parent = null, source = null, target = null, index = null) {
    return this.addCell(edge, parent, index, source, target);
  },

  // ***************************************************************************
  // Group: Folding
  // ***************************************************************************

  addAllEdges(cells) {
    const allCells = cells.slice();
    return removeDuplicates(allCells.concat(this.getAllEdges(cells)));
  },

  getAllEdges(cells) {
    let edges: Cell[] = [];

    if (cells) {
      for (let i = 0; i < cells.length; i += 1) {
        const edgeCount = cells[i].getEdgeCount();

        for (let j = 0; j < edgeCount; j++) {
          edges.push(cells[i].getEdgeAt(j));
        }

        // Recurses
        const children = cells[i].getChildren();
        edges = edges.concat(this.getAllEdges(children));
      }
    }
    return edges;
  },

  getIncomingEdges(cell, parent = null) {
    return this.getEdges(cell, parent, true, false, false);
  },

  getOutgoingEdges(cell, parent = null) {
    return this.getEdges(cell, parent, false, true, false);
  },

  getEdges(
    cell,
    parent = null,
    incoming = true,
    outgoing = true,
    includeLoops = true,
    recurse = false
  ) {
    let edges: Cell[] = [];
    const isCollapsed = cell.isCollapsed();
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);

      if (isCollapsed || !child.isVisible()) {
        edges = edges.concat(child.getEdges(incoming, outgoing));
      }
    }

    edges = edges.concat(cell.getEdges(incoming, outgoing));
    const result = [];

    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);

      const source = state
        ? state.getVisibleTerminal(true)
        : this.getView().getVisibleTerminal(edges[i], true);
      const target = state
        ? state.getVisibleTerminal(false)
        : this.getView().getVisibleTerminal(edges[i], false);

      if (
        (includeLoops && source === target) ||
        (source !== target &&
          ((incoming &&
            target === cell &&
            (!parent || this.isValidAncestor(source, parent, recurse))) ||
            (outgoing &&
              source === cell &&
              (!parent || this.isValidAncestor(target, parent, recurse)))))
      ) {
        result.push(edges[i]);
      }
    }
    return result;
  },

  // ***************************************************************************
  // Group: Cell retrieval
  // ***************************************************************************

  getChildEdges(parent) {
    return this.getChildCells(parent, false, true);
  },

  getEdgesBetween(source, target, directed = false) {
    const edges = this.getEdges(source);
    const result = [];

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);

      const src = state
        ? state.getVisibleTerminal(true)
        : this.getView().getVisibleTerminal(edges[i], true);
      const trg = state
        ? state.getVisibleTerminal(false)
        : this.getView().getVisibleTerminal(edges[i], false);

      if (
        (src === source && trg === target) ||
        (!directed && src === target && trg === source)
      ) {
        result.push(edges[i]);
      }
    }
    return result;
  },

  // ***************************************************************************
  // Group: Cell moving
  // ***************************************************************************

  resetEdges(cells) {
    // Prepares faster cells lookup
    const dict = new Map<Cell | null, boolean>();

    for (let i = 0; i < cells.length; i += 1) {
      dict.set(cells[i], true);
    }

    this.batchUpdate(() => {
      for (let i = 0; i < cells.length; i += 1) {
        const edges = cells[i].getEdges();

        for (let j = 0; j < edges.length; j++) {
          const state = this.getView().getState(edges[j]);

          const source = state
            ? state.getVisibleTerminal(true)
            : this.getView().getVisibleTerminal(edges[j], true);
          const target = state
            ? state.getVisibleTerminal(false)
            : this.getView().getVisibleTerminal(edges[j], false);

          // Checks if one of the terminals is not in the given array
          if (!dict.get(source) || !dict.get(target)) {
            this.resetEdge(edges[j]);
          }
        }

        this.resetEdges(cells[i].getChildren());
      }
    });
  },

  resetEdge(edge) {
    let geo = edge.getGeometry();

    // Resets the control points
    if (geo && geo.points && (<Point[]>geo.points).length > 0) {
      geo = geo.clone();
      geo.points = [];
      this.getDataModel().setGeometry(edge, geo);
    }

    return edge;
  },
};
