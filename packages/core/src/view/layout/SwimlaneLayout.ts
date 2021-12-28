/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import GraphLayout from './GraphLayout';
import { DIRECTION } from '../../util/constants';
import HierarchicalEdgeStyle from './datatypes/HierarchicalEdgeStyle';
import Dictionary from '../../util/Dictionary';
import Rectangle from '../geometry/Rectangle';
import SwimlaneModel from './hierarchical/SwimlaneModel';
import ObjectIdentity from '../../util/ObjectIdentity';
import SwimlaneOrdering from './hierarchical/SwimlaneOrdering';
import MedianHybridCrossingReduction from './hierarchical/MedianHybridCrossingReduction';
import CoordinateAssignment from './hierarchical/CoordinateAssignment';
import { Graph } from '../Graph';
import Cell from '../cell/Cell';
import CellArray from '../cell/CellArray';
import Geometry from 'src/view/geometry/Geometry';
import GraphHierarchyNode from './datatypes/GraphHierarchyNode';

/**
 * A hierarchical layout algorithm.
 *
 * Constructor: mxSwimlaneLayout
 *
 * Constructs a new hierarchical layout algorithm.
 *
 * Arguments:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * orientation - Optional constant that defines the orientation of this
 * layout.
 * deterministic - Optional boolean that specifies if this layout should be
 * deterministic. Default is true.
 */
class SwimlaneLayout extends GraphLayout {
  constructor(graph: Graph, orientation: DIRECTION | null, deterministic: boolean = true) {
    super(graph);
    this.orientation = orientation != null ? orientation : DIRECTION.NORTH;
    this.deterministic = deterministic != null ? deterministic : true;
  }

  parentX: number | null = null;
  parentY: number | null = null;
  deterministic: boolean;

  /**
   * Holds the array of <Cell> that this layout contains.
   */
  roots: CellArray | null = null;

  /**
   * Holds the array of <Cell> of the ordered swimlanes to lay out
   */
  swimlanes: CellArray | null = null;

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
   * Default is <mxConstants.DIRECTION_NORTH>.
   */
  orientation: DIRECTION = DIRECTION.NORTH;

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
   * The internal <mxSwimlaneModel> formed of the layout.
   */
  model: SwimlaneModel | null = null;

  /**
   * A cache of edges whose source terminal is the key
   */
  edgesCache: Dictionary<Cell, CellArray> = new Dictionary();

  /**
   * A cache of edges whose source terminal is the key
   */
  edgeSourceTermCache: Dictionary<Cell, Cell> = new Dictionary();

  /**
   * A cache of edges whose source terminal is the key
   */
  edgesTargetTermCache: Dictionary<Cell, Cell> = new Dictionary();

  /**
   * The style to apply between cell layers to edge segments.
   * Default is <mxHierarchicalEdgeStyle.POLYLINE>.
   */
  edgeStyle = HierarchicalEdgeStyle.POLYLINE;

  /**
   * Returns the internal <mxSwimlaneModel> for this layout algorithm.
   */
  getModel() {
    return this.model;
  }

  /**
   * Executes the layout for the children of the specified parent.
   *
   * @param parent Parent <Cell> that contains the children to be laid out.
   * @param swimlanes Ordered array of swimlanes to be laid out
   */
  execute(parent: Cell, swimlanes: CellArray): void {
    this.parent = parent;
    const { model } = this.graph;
    this.edgesCache = new Dictionary();
    this.edgeSourceTermCache = new Dictionary();
    this.edgesTargetTermCache = new Dictionary();

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
      parent = swimlanes[0].getParent();
    }

    //  Maintaining parent location
    this.parentX = null;
    this.parentY = null;

    if (
      parent !== this.root &&
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
    const dummyVertices = new CellArray();

    // Check the swimlanes all have vertices
    // in them
    for (let i = 0; i < swimlanes.length; i += 1) {
      const children = this.graph.getChildCells(swimlanes[i]);

      if (children == null || children.length === 0) {
        const vertex = this.graph.insertVertex(
          swimlanes[i],
          null,
          null,
          0,
          0,
          this.dummyVertexWidth,
          0
        );
        dummyVertices.push(vertex);
      }
    }

    model.beginUpdate();
    try {
      this.run(parent);

      if (this.resizeParent && !parent.isCollapsed()) {
        this.graph.updateGroupBounds(new CellArray(parent), this.parentBorder, this.moveParent);
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
    const cells = new CellArray();
    const model = <SwimlaneModel>this.model;

    for (const key in model.edgeMapper) {
      // @ts-expect-error
      const edge = model.edgeMapper[key];

      for (let i = 0; i < edge.edges.length; i += 1) {
        cells.push(edge.edges[i]);
      }
    }

    let layoutBounds = this.graph.getBoundingBoxFromGeometry(cells, true);
    const childBounds = [];
    const swimlanes = <CellArray>this.swimlanes;

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
        newGeo.height = (<Rectangle>layoutBounds).height + size.height + 2 * this.parentBorder;

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
  getEdges(cell: Cell): CellArray {
    const cachedEdges = this.edgesCache.get(cell);

    if (cachedEdges != null) {
      return cachedEdges;
    }

    let edges = new CellArray();
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
    const result = new CellArray();

    for (let i = 0; i < edges.length; i += 1) {
      const source = this.getVisibleTerminal(edges[i], true);
      const target = this.getVisibleTerminal(edges[i], false);

      if (
        source === target ||
        (source !== target &&
          ((target === cell &&
            (this.parent == null ||
              this.graph.isValidAncestor(<Cell>source, this.parent, this.traverseAncestors))) ||
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

    this.edgesCache.put(cell, result);
    return result;
  }

  /**
   * Helper function to return visible terminal for edge allowing for ports
   *
   * @param edge <Cell> whose edges should be returned.
   * @param source Boolean that specifies whether the source or target terminal is to be returned
   */
  getVisibleTerminal(edge: Cell, source: boolean): Cell | null {
    let terminalCache = this.edgesTargetTermCache;

    if (source) {
      terminalCache = this.edgeSourceTermCache;
    }

    const term = terminalCache.get(edge);

    if (term != null) {
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
      terminalCache.put(edge, terminal);
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

      this.roots = new CellArray();
      let filledVertexSetEmpty = true;

      // Poor man's isSetEmpty
      for (var key in filledVertexSet) {
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

          this.traverse(
            candidateRoots[i],
            true,
            null,
            allVertexSet,
            vertexSet,
            hierarchyVertices,
            filledVertexSet,
            laneCounter
          );
        }

        for (let i = 0; i < candidateRoots.length; i += 1) {
          this.roots.push(candidateRoots[i]);
        }

        filledVertexSetEmpty = true;

        // Poor man's isSetEmpty
        for (var key in filledVertexSet) {
          if (filledVertexSet[key] != null) {
            filledVertexSetEmpty = false;
            break;
          }
        }
      }
    } else {
      // Find vertex set as directed traversal from roots
      const roots = <Cell[]>this.roots;

      for (let i = 0; i < roots.length; i += 1) {
        const vertexSet = Object();
        hierarchyVertices.push(vertexSet);
        this.traverse(roots[i], true, null, allVertexSet, vertexSet, hierarchyVertices, null);
      }
    }

    const tmp = new CellArray();
    for (var key in allVertexSet) {
      tmp.push(allVertexSet[key]);
    }

    this.model = new SwimlaneModel(this, tmp, <CellArray>this.roots, parent, this.tightenToSource);

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
  getEdgesBetween(source: Cell, target: Cell, directed: boolean = false) {
    const edges = this.getEdges(source);
    const result = new CellArray();

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
  traverse(
    vertex: Cell,
    directed: boolean,
    edge: Cell | null,
    allVertices: { [key: string]: Cell },
    currentComp: { [key: string]: Cell },
    hierarchyVertices: GraphHierarchyNode[],
    filledVertexSet: { [key: string]: Cell } | null,
    swimlaneIndex: number
  ) {
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
        const { model } = this.graph;

        for (let i = 0; i < edges.length; i += 1) {
          let otherVertex = this.getVisibleTerminal(edges[i], true);
          const isSource = otherVertex === vertex;

          if (isSource) {
            otherVertex = this.getVisibleTerminal(edges[i], false);
          }

          let otherIndex = 0;
          const swimlanes = <CellArray>this.swimlanes;

          // Get the swimlane index of the other terminal
          for (otherIndex = 0; otherIndex < swimlanes.length; otherIndex++) {
            if (swimlanes[otherIndex].isAncestor(otherVertex)) {
              break;
            }
          }

          if (otherIndex >= swimlanes.length) {
            continue;
          }

          // Traverse if the other vertex is within the same swimlane as
          // as the current vertex, or if the swimlane index of the other
          // vertex is greater than that of this vertex
          if (
            otherIndex > swimlaneIndex ||
            ((!directed || isSource) && otherIndex === swimlaneIndex)
          ) {
            currentComp = this.traverse(
              <Cell>otherVertex,
              directed,
              edges[i],
              allVertices,
              currentComp,
              hierarchyVertices,
              filledVertexSet,
              otherIndex
            );
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
