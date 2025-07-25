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

import GraphLayout from './GraphLayout.js';
import type { DirectionValue } from '../../types.js';
import HierarchicalEdgeStyle from './datatypes/HierarchicalEdgeStyle.js';
import Rectangle from '../geometry/Rectangle.js';
import SwimlaneModel from './hierarchical/SwimlaneModel.js';
import ObjectIdentity from '../../util/ObjectIdentity.js';
import SwimlaneOrdering from './hierarchical/SwimlaneOrdering.js';
import MedianHybridCrossingReduction from './hierarchical/MedianHybridCrossingReduction.js';
import CoordinateAssignment from './hierarchical/CoordinateAssignment.js';
import type { AbstractGraph } from '../AbstractGraph.js';
import type Cell from '../cell/Cell.js';
import Geometry from '../../view/geometry/Geometry.js';
import { SwimlaneGraphLayoutTraverseArgs } from './types.js';

/**
 * A hierarchical layout algorithm.
 *
 * @category Layout
 */
class SwimlaneLayout extends GraphLayout {
  /**
   * Constructs a new hierarchical layout algorithm.
   *
   * @param graph Reference to the enclosing {@link AbstractGraph}.
   * @param orientation Optional constant that defines the orientation of this layout. Default is 'north'.
   * @param deterministic Optional boolean that specifies if this layout should be deterministic. Default is `true`.
   */
  constructor(
    graph: AbstractGraph,
    orientation: DirectionValue | null,
    deterministic = true
  ) {
    super(graph);
    this.orientation = orientation != null ? orientation : 'north';
    this.deterministic = deterministic != null ? deterministic : true;
  }

  parentX: number | null = null;
  parentY: number | null = null;
  deterministic: boolean;

  /**
   * Holds the array of <Cell> that this layout contains.
   */
  roots: Cell[] | null = null;

  /**
   * Holds the array of <Cell> of the ordered swimlanes to lay out
   */
  swimlanes: Cell[] | null = null;

  /**
   * The cell width of any dummy vertices inserted
   */
  dummyVertexWidth = 50;

  /**
   * Specifies if the parent should be resized after the layout so that it
   * contains all the child cells. Default is false. See also <parentBorder>.
   */
  resizeParent = false;

  /**
   * Specifies if the parent location should be maintained, so that the
   * top, left corner stays the same before and after execution of
   * the layout. Default is false for backwards compatibility.
   */
  maintainParentLocation = false;

  /**
   * Specifies if the parent should be moved if <resizeParent> is enabled.
   * Default is false.
   */
  moveParent = false;

  /**
   * The border to be added around the children if the parent is to be
   * resized using <resizeParent>. Default is 30.
   */
  parentBorder = 30;

  /**
   * The spacing buffer added between cells on the same layer. Default is 30.
   */
  intraCellSpacing = 30;

  /**
   * The spacing buffer added between cell on adjacent layers. Default is 100.
   */
  interRankCellSpacing = 100;

  /**
   * The spacing buffer between unconnected hierarchies. Default is 60.
   */
  interHierarchySpacing = 60;

  /**
   * The distance between each parallel edge on each ranks for long edges.
   * Default is 10.
   */
  parallelEdgeSpacing = 10;

  /**
   * The position of the root node(s) relative to the laid out graph in.
   * @default 'north'.
   */
  orientation: DirectionValue = 'north';

  /**
   * Whether or not to perform local optimisations and iterate multiple times
   * through the algorithm. Default is true.
   */
  fineTuning = true;

  /**
   * Whether or not to tighten the assigned ranks of vertices up towards
   * the source cells. Default is true.
   */
  tightenToSource = true;

  /**
   * Specifies if the STYLE_NOEDGESTYLE flag should be set on edges that are
   * modified by the result. Default is true.
   */
  disableEdgeStyle = true;

  /**
   * Whether or not to drill into child cells and layout in reverse
   * group order. This also cause the layout to navigate edges whose
   * terminal vertices have different parents but are in the same
   * ancestry chain. Default is true.
   */
  traverseAncestors = true;

  /**
   * The internal {@link SwimlaneModel} formed of the layout.
   */
  model: SwimlaneModel | null = null;

  /**
   * A cache of edges whose source terminal is the key
   */
  edgesCache: Map<Cell, Cell[]> = new Map();

  /**
   * A cache of edges whose source terminal is the key
   */
  edgeSourceTermCache: Map<Cell, Cell> = new Map();

  /**
   * A cache of edges whose source terminal is the key
   */
  edgesTargetTermCache: Map<Cell, Cell> = new Map();

  /**
   * The style to apply between cell layers to edge segments.
   * Default is {@link HierarchicalEdgeStyle#POLYLINE}.
   */
  edgeStyle = HierarchicalEdgeStyle.POLYLINE;

  /**
   * Returns the internal {@link SwimlaneModel} for this layout algorithm.
   */
  getDataModel() {
    return this.model;
  }

  /**
   * Executes the layout for the children of the specified parent.
   *
   * @param parent Parent <Cell> that contains the children to be laid out.
   * @param swimlanes Ordered array of swimlanes to be laid out
   */
  execute(parent: Cell, swimlanes: Cell[] | null = null): void {
    this.parent = parent;
    const { model } = this.graph;
    this.edgesCache = new Map();
    this.edgeSourceTermCache = new Map();
    this.edgesTargetTermCache = new Map();

    // If the roots are set and the parent is set, only
    // use the roots that are some dependent of the that
    // parent.
    // If just the root are set, use them as-is
    // If just the parent is set use it's immediate
    // children as the initial set

    if (swimlanes == null || swimlanes.length < 1) {
      // TODO indicate the problem
      return;
    }

    if (parent == null) {
      parent = <Cell>swimlanes[0].getParent();
    }

    //  Maintaining parent location
    this.parentX = null;
    this.parentY = null;

    if (
      parent !== this.graph.getDataModel().root &&
      parent.isVertex() != null &&
      this.maintainParentLocation
    ) {
      const geo = parent.getGeometry();

      if (geo != null) {
        this.parentX = geo.x;
        this.parentY = geo.y;
      }
    }

    this.swimlanes = swimlanes;
    const dummyVertices = [];

    // Check the swimlanes all have vertices
    // in them
    for (let i = 0; i < swimlanes.length; i += 1) {
      const children = this.graph.getChildCells(swimlanes[i]);

      if (children == null || children.length === 0) {
        const vertex = this.graph.insertVertex({
          parent: swimlanes[i],
          position: [0, 0],
          size: [this.dummyVertexWidth, 0],
        });
        dummyVertices.push(vertex);
      }
    }

    model.beginUpdate();
    try {
      this.run(parent);

      if (this.resizeParent && !parent.isCollapsed()) {
        this.graph.updateGroupBounds([parent], this.parentBorder, this.moveParent);
      }

      // Maintaining parent location
      if (this.parentX != null && this.parentY != null) {
        let geo = parent.getGeometry();

        if (geo != null) {
          geo = geo.clone();
          geo.x = this.parentX;
          geo.y = this.parentY;
          model.setGeometry(parent, geo);
        }
      }

      this.graph.removeCells(dummyVertices);
    } finally {
      model.endUpdate();
    }
  }

  /**
   * Updates the bounds of the given array of groups so that it includes
   * all child vertices.
   *
   */
  updateGroupBounds(): void {
    // Get all vertices and edge in the layout
    const cells = [];
    const model = <SwimlaneModel>this.model;

    for (const cell of model.edgeMapper.keys()) {
      for (let i = 0; i < cell.edges.length; i += 1) {
        cells.push(cell.edges[i]);
      }
    }

    let layoutBounds = this.graph.getBoundingBoxFromGeometry(cells, true);
    const childBounds = [];
    const swimlanes = this.swimlanes as Cell[];

    for (let i = 0; i < swimlanes.length; i += 1) {
      const lane = swimlanes[i];
      const geo = lane.getGeometry();

      if (geo != null) {
        const children = this.graph.getChildCells(lane);

        const size = this.graph.isSwimlane(lane)
          ? this.graph.getStartSize(lane)
          : new Rectangle();

        const bounds = <Rectangle>this.graph.getBoundingBoxFromGeometry(children);
        childBounds[i] = bounds;
        const childrenY = bounds.y + geo.y - size.height - this.parentBorder;
        const maxChildrenY = bounds.y + geo.y + bounds.height;

        if (layoutBounds == null) {
          layoutBounds = new Rectangle(0, childrenY, 0, maxChildrenY - childrenY);
        } else {
          layoutBounds.y = Math.min(layoutBounds.y, childrenY);
          const maxY = Math.max(layoutBounds.y + layoutBounds.height, maxChildrenY);
          layoutBounds.height = maxY - layoutBounds.y;
        }
      }
    }

    for (let i = 0; i < swimlanes.length; i += 1) {
      const lane = swimlanes[i];
      const geo = lane.getGeometry();

      if (geo != null) {
        const children = this.graph.getChildCells(lane);

        const size = this.graph.isSwimlane(lane)
          ? this.graph.getStartSize(lane)
          : new Rectangle();

        const newGeo = geo.clone();

        const leftGroupBorder =
          i === 0 ? this.parentBorder : this.interRankCellSpacing / 2;
        const w = size.width + leftGroupBorder;
        const x = childBounds[i].x - w;
        const y = (<Rectangle>layoutBounds).y - this.parentBorder;

        newGeo.x += x;
        newGeo.y = y;

        newGeo.width = childBounds[i].width + w + this.interRankCellSpacing / 2;
        newGeo.height =
          (<Rectangle>layoutBounds).height + size.height + 2 * this.parentBorder;

        this.graph.model.setGeometry(lane, newGeo);
        this.graph.moveCells(children, -x, geo.y - y);
      }
    }
  }

  /**
   * Returns all visible children in the given parent which do not have
   * incoming edges. If the result is empty then the children with the
   * maximum difference between incoming and outgoing edges are returned.
   * This takes into account edges that are being promoted to the given
   * root due to invisible children or collapsed cells.
   *
   * @param parent <Cell> whose children should be checked.
   * @param vertices array of vertices to limit search to
   */
  findRoots(parent: Cell, vertices: { [key: string]: Cell }): Cell[] {
    const roots = [];

    if (parent != null && vertices != null) {
      const { model } = this.graph;
      let best = null;
      let maxDiff = -100000;

      for (const i in vertices) {
        const cell = vertices[i];

        if (
          cell != null &&
          cell.isVertex() &&
          cell.isVisible() &&
          parent.isAncestor(cell)
        ) {
          const conns = this.getEdges(cell);
          let fanOut = 0;
          let fanIn = 0;

          for (let k = 0; k < conns.length; k++) {
            const src = this.getVisibleTerminal(conns[k], true);

            if (src === cell) {
              // Only count connection within this swimlane
              const other = this.getVisibleTerminal(conns[k], false);

              if (parent.isAncestor(other)) {
                fanOut += 1;
              }
            } else if (parent.isAncestor(src)) {
              fanIn += 1;
            }
          }

          if (fanIn === 0 && fanOut > 0) {
            roots.push(cell);
          }

          const diff = fanOut - fanIn;

          if (diff > maxDiff) {
            maxDiff = diff;
            best = cell;
          }
        }
      }

      if (roots.length === 0 && best != null) {
        roots.push(best);
      }
    }
    return roots;
  }

  /**
   * Returns the connected edges for the given cell.
   *
   * @param cell <Cell> whose edges should be returned.
   */
  getEdges(cell: Cell): Cell[] {
    const cachedEdges = this.edgesCache.get(cell);

    if (cachedEdges != null) {
      return cachedEdges;
    }

    let edges: Cell[] = [];
    const isCollapsed = cell.isCollapsed();
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);

      if (this.isPort(child)) {
        edges = edges.concat(child.getEdges(true, true));
      } else if (isCollapsed || !child.isVisible()) {
        edges = edges.concat(child.getEdges(true, true));
      }
    }

    edges = edges.concat(cell.getEdges(true, true));
    const result = [];

    for (let i = 0; i < edges.length; i += 1) {
      const source = this.getVisibleTerminal(edges[i], true);
      const target = this.getVisibleTerminal(edges[i], false);

      if (
        source === target ||
        (source !== target &&
          ((target === cell &&
            (this.parent == null ||
              this.graph.isValidAncestor(
                <Cell>source,
                this.parent,
                this.traverseAncestors
              ))) ||
            (source === cell &&
              (this.parent == null ||
                this.graph.isValidAncestor(
                  <Cell>target,
                  this.parent,
                  this.traverseAncestors
                )))))
      ) {
        result.push(edges[i]);
      }
    }

    this.edgesCache.set(cell, result);
    return result;
  }

  /**
   * Helper function to return visible terminal for edge allowing for ports
   *
   * @param edge <Cell> whose edges should be returned.
   * @param source Boolean that specifies whether the source or target terminal is to be returned
   */
  getVisibleTerminal(edge: Cell, source: boolean): Cell | null {
    const terminalCache = source ? this.edgeSourceTermCache : this.edgesTargetTermCache;

    const term = terminalCache.get(edge);
    if (term) {
      return term;
    }

    const state = this.graph.view.getState(edge);

    let terminal =
      state != null
        ? state.getVisibleTerminal(source)
        : this.graph.view.getVisibleTerminal(edge, source);

    if (terminal == null) {
      terminal =
        state != null
          ? state.getVisibleTerminal(source)
          : this.graph.view.getVisibleTerminal(edge, source);
    }

    if (terminal != null) {
      if (this.isPort(terminal)) {
        terminal = <Cell>terminal.getParent();
      }
      terminalCache.set(edge, terminal);
    }
    return terminal;
  }

  /**
   * The API method used to exercise the layout upon the graph description
   * and produce a separate description of the vertex position and edge
   * routing changes made. It runs each stage of the layout that has been
   * created.
   */
  run(parent: Cell): void {
    // Separate out unconnected hierarchies
    const hierarchyVertices = [];
    const allVertexSet: { [key: string]: Cell } = {};

    if (this.swimlanes != null && this.swimlanes.length > 0 && parent != null) {
      const filledVertexSet: { [key: string]: Cell } = {};

      for (let i = 0; i < this.swimlanes.length; i += 1) {
        this.filterDescendants(this.swimlanes[i], filledVertexSet);
      }

      this.roots = [];
      let filledVertexSetEmpty = true;

      // Poor man's isSetEmpty
      for (const key in filledVertexSet) {
        if (filledVertexSet[key] != null) {
          filledVertexSetEmpty = false;
          break;
        }
      }

      // Only test for candidates in each swimlane in order
      let laneCounter = 0;

      while (!filledVertexSetEmpty && laneCounter < this.swimlanes.length) {
        const candidateRoots = this.findRoots(
          this.swimlanes[laneCounter],
          filledVertexSet
        );

        if (candidateRoots.length === 0) {
          laneCounter++;
          continue;
        }

        // If the candidate root is an unconnected group cell, remove it from
        // the layout. We may need a custom set that holds such groups and forces
        // them to be processed for resizing and/or moving.
        for (let i = 0; i < candidateRoots.length; i += 1) {
          const vertexSet = Object();
          hierarchyVertices.push(vertexSet);

          this.traverse({
            vertex: candidateRoots[i],
            directed: true,
            edge: null,
            allVertices: allVertexSet,
            currentComp: vertexSet,
            hierarchyVertices,
            filledVertexSet,
            swimlaneIndex: laneCounter,
            func: null,
            visited: null,
          });
        }

        for (let i = 0; i < candidateRoots.length; i += 1) {
          this.roots.push(candidateRoots[i]);
        }

        filledVertexSetEmpty = true;

        // Poor man's isSetEmpty
        for (const key in filledVertexSet) {
          if (filledVertexSet[key] != null) {
            filledVertexSetEmpty = false;
            break;
          }
        }
      }
    } else {
      // Find vertex set as directed traversal from roots
      const roots = this.roots as Cell[];

      for (let i = 0; i < roots.length; i += 1) {
        const vertexSet = Object();
        hierarchyVertices.push(vertexSet);
        this.traverse({
          vertex: roots[i],
          directed: true,
          edge: null,
          allVertices: allVertexSet,
          currentComp: vertexSet,
          hierarchyVertices,
          filledVertexSet: null,
          swimlaneIndex: i,
          func: null,
          visited: null,
        }); // CHECK THIS PARAM!! ====================
      }
    }

    const tmp = [];
    for (const key in allVertexSet) {
      tmp.push(allVertexSet[key]);
    }

    this.model = new SwimlaneModel(
      this,
      tmp,
      this.roots as Cell[],
      parent,
      this.tightenToSource
    );

    this.cycleStage(parent);
    this.layeringStage();

    this.crossingStage(parent);
    this.placementStage(0, parent);
  }

  /**
   * Creates an array of descendant cells
   */
  filterDescendants(cell: Cell, result: { [key: string]: Cell }) {
    const { model } = this.graph;

    if (
      cell.isVertex() &&
      cell !== this.parent &&
      cell.getParent() !== this.parent &&
      cell.isVisible()
    ) {
      result[<string>ObjectIdentity.get(cell)] = cell;
    }

    if (this.traverseAncestors || (cell === this.parent && cell.isVisible())) {
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const child = cell.getChildAt(i);

        // Ignore ports in the layout vertex list, they are dealt with
        // in the traversal mechanisms
        if (!this.isPort(child)) {
          this.filterDescendants(child, result);
        }
      }
    }
  }

  /**
   * Returns true if the given cell is a "port", that is, when connecting to
   * it, its parent is the connecting vertex in terms of graph traversal
   *
   * @param cell <Cell> that represents the port.
   */
  isPort(cell: Cell): boolean {
    if ((<Geometry>cell.geometry).relative) {
      return true;
    }
    return false;
  }

  /**
   * Returns the edges between the given source and target. This takes into
   * account collapsed and invisible cells and ports.
   *
   * source -
   * target -
   * directed -
   */
  getEdgesBetween(source: Cell, target: Cell, directed = false) {
    const edges = this.getEdges(source);
    const result = [];

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edges.length; i += 1) {
      const src = this.getVisibleTerminal(edges[i], true);
      const trg = this.getVisibleTerminal(edges[i], false);

      if (
        (src === source && trg === target) ||
        (!directed && src === target && trg === source)
      ) {
        result.push(edges[i]);
      }
    }
    return result;
  }

  /**
   * Traverses the (directed) graph invoking the given function for each
   * visited vertex and edge. The function is invoked with the current vertex
   * and the incoming edge as a parameter. This implementation makes sure
   * each vertex is only visited once. The function may return false if the
   * traversal should stop at the given vertex.
   *
   * @param vertex <Cell> that represents the vertex where the traversal starts.
   * @param directed boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * @param edge Optional <Cell> that represents the incoming edge. This is
   * null for the first step of the traversal.
   * @param allVertices Array of cell paths for the visited cells.
   * @param swimlaneIndex the laid out order index of the swimlane vertex is contained in
   */
  traverse({
    vertex,
    directed,
    allVertices,
    currentComp,
    hierarchyVertices,
    filledVertexSet,
    swimlaneIndex,
  }: SwimlaneGraphLayoutTraverseArgs) {
    if (vertex != null && allVertices != null) {
      // Has this vertex been seen before in any traversal
      // And if the filled vertex set is populated, only
      // process vertices in that it contains
      const vertexID = <string>ObjectIdentity.get(vertex);

      if (
        allVertices[vertexID] == null &&
        (filledVertexSet == null ? true : filledVertexSet[vertexID] != null)
      ) {
        if (currentComp[vertexID] == null) {
          currentComp[vertexID] = vertex;
        }
        if (allVertices[vertexID] == null) {
          allVertices[vertexID] = vertex;
        }

        if (filledVertexSet !== null) {
          delete filledVertexSet[vertexID];
        }

        const edges = this.getEdges(vertex);

        for (let i = 0; i < edges.length; i += 1) {
          let otherVertex = this.getVisibleTerminal(edges[i], true);
          const isSource = otherVertex === vertex;

          if (isSource) {
            otherVertex = this.getVisibleTerminal(edges[i], false);
          }

          let otherIndex = 0;

          // Get the swimlane index of the other terminal
          for (otherIndex = 0; otherIndex < this.swimlanes!.length; otherIndex++) {
            if (this.swimlanes![otherIndex].isAncestor(otherVertex)) {
              break;
            }
          }

          if (otherIndex >= this.swimlanes!.length) {
            continue;
          }

          // Traverse if the other vertex is within the same swimlane as
          // as the current vertex, or if the swimlane index of the other
          // vertex is greater than that of this vertex
          if (
            otherIndex > swimlaneIndex ||
            ((!directed || isSource) && otherIndex === swimlaneIndex)
          ) {
            currentComp = this.traverse({
              vertex: otherVertex,
              directed,
              edge: edges[i],
              allVertices,
              currentComp,
              hierarchyVertices,
              filledVertexSet,
              swimlaneIndex: otherIndex,
              func: null,
              visited: null,
            });
          }
        }
      } else if (currentComp[vertexID] == null) {
        // We've seen this vertex before, but not in the current component
        // This component and the one it's in need to be merged
        for (let i = 0; i < hierarchyVertices.length; i += 1) {
          const comp = hierarchyVertices[i];

          // @ts-expect-error
          if (comp[vertexID] != null) {
            for (const key in comp) {
              // @ts-expect-error
              currentComp[key] = comp[key];
            }

            // Remove the current component from the hierarchy set
            hierarchyVertices.splice(i, 1);
            return currentComp;
          }
        }
      }
    }
    return currentComp;
  }

  /**
   * Executes the cycle stage using mxMinimumCycleRemover.
   */
  cycleStage(parent: Cell) {
    const cycleStage = new SwimlaneOrdering(this);
    cycleStage.execute(parent);
  }

  /**
   * Implements first stage of a Sugiyama layout.
   */
  layeringStage(): void {
    const model = <SwimlaneModel>this.model;
    model.initialRank();
    model.fixRanks();
  }

  /**
   * Executes the crossing stage using mxMedianHybridCrossingReduction.
   */
  crossingStage(parent: Cell): void {
    const crossingStage = new MedianHybridCrossingReduction(this);
    crossingStage.execute(parent);
  }

  /**
   * Executes the placement stage using mxCoordinateAssignment.
   */
  placementStage(initialX: number, parent: Cell): number {
    const placementStage = new CoordinateAssignment(
      this,
      this.intraCellSpacing,
      this.interRankCellSpacing,
      this.orientation,
      initialX,
      this.parallelEdgeSpacing
    );
    placementStage.fineTuning = this.fineTuning;
    placementStage.execute(parent);

    return <number>placementStage.limitX + this.interHierarchySpacing;
  }
}

export default SwimlaneLayout;
