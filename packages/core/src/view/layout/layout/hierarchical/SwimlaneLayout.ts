/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import GraphLayout from '../GraphLayout';
import { DIRECTION_NORTH } from '../../../../util/Constants';
import HierarchicalEdgeStyle from './HierarchicalEdgeStyle';
import Dictionary from '../../../../util/Dictionary';
import Rectangle from '../../../geometry/Rectangle';
import SwimlaneModel from './model/SwimlaneModel';
import ObjectIdentity from '../../../../util/ObjectIdentity';
import mxSwimlaneOrdering from './stage/mxSwimlaneOrdering';
import MedianHybridCrossingReduction from './stage/MedianHybridCrossingReduction';
import CoordinateAssignment from './stage/CoordinateAssignment';
import { Graph } from '../../../Graph';
import Cell from '../../../cell/datatypes/Cell';
import CellArray from '../../../cell/datatypes/CellArray';

/**
 * Class: mxSwimlaneLayout
 *
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
  constructor(graph: Graph, orientation, deterministic: boolean = true) {
    super(graph);
    this.orientation = orientation != null ? orientation : DIRECTION_NORTH;
    this.deterministic = deterministic != null ? deterministic : true;
  }

  /**
   * Variable: roots
   *
   * Holds the array of <mxCell> that this layout contains.
   */
  roots = null;

  /**
   * Variable: swimlanes
   *
   * Holds the array of <mxCell> of the ordered swimlanes to lay out
   */
  swimlanes = null;

  /**
   * Variable: dummyVertexWidth
   *
   * The cell width of any dummy vertices inserted
   */
  dummyVertexWidth = 50;

  /**
   * Variable: resizeParent
   *
   * Specifies if the parent should be resized after the layout so that it
   * contains all the child cells. Default is false. See also <parentBorder>.
   */
  resizeParent = false;

  /**
   * Variable: maintainParentLocation
   *
   * Specifies if the parent location should be maintained, so that the
   * top, left corner stays the same before and after execution of
   * the layout. Default is false for backwards compatibility.
   */
  maintainParentLocation = false;

  /**
   * Variable: moveParent
   *
   * Specifies if the parent should be moved if <resizeParent> is enabled.
   * Default is false.
   */
  moveParent = false;

  /**
   * Variable: parentBorder
   *
   * The border to be added around the children if the parent is to be
   * resized using <resizeParent>. Default is 30.
   */
  parentBorder = 30;

  /**
   * Variable: intraCellSpacing
   *
   * The spacing buffer added between cells on the same layer. Default is 30.
   */
  intraCellSpacing = 30;

  /**
   * Variable: interRankCellSpacing
   *
   * The spacing buffer added between cell on adjacent layers. Default is 100.
   */
  interRankCellSpacing = 100;

  /**
   * Variable: interHierarchySpacing
   *
   * The spacing buffer between unconnected hierarchies. Default is 60.
   */
  interHierarchySpacing = 60;

  /**
   * Variable: parallelEdgeSpacing
   *
   * The distance between each parallel edge on each ranks for long edges.
   * Default is 10.
   */
  parallelEdgeSpacing = 10;

  /**
   * Variable: orientation
   *
   * The position of the root node(s) relative to the laid out graph in.
   * Default is <mxConstants.DIRECTION_NORTH>.
   */
  orientation = DIRECTION_NORTH;

  /**
   * Variable: fineTuning
   *
   * Whether or not to perform local optimisations and iterate multiple times
   * through the algorithm. Default is true.
   */
  fineTuning = true;

  /**
   * Variable: tightenToSource
   *
   * Whether or not to tighten the assigned ranks of vertices up towards
   * the source cells. Default is true.
   */
  tightenToSource = true;

  /**
   * Variable: disableEdgeStyle
   *
   * Specifies if the STYLE_NOEDGESTYLE flag should be set on edges that are
   * modified by the result. Default is true.
   */
  disableEdgeStyle = true;

  /**
   * Variable: traverseAncestors
   *
   * Whether or not to drill into child cells and layout in reverse
   * group order. This also cause the layout to navigate edges whose
   * terminal vertices have different parents but are in the same
   * ancestry chain. Default is true.
   */
  traverseAncestors = true;

  /**
   * Variable: model
   *
   * The internal <mxSwimlaneModel> formed of the layout.
   */
  model = null;

  /**
   * Variable: edgesSet
   *
   * A cache of edges whose source terminal is the key
   */
  edgesCache = null;

  /**
   * Variable: edgesSet
   *
   * A cache of edges whose source terminal is the key
   */
  edgeSourceTermCache = null;

  /**
   * Variable: edgesSet
   *
   * A cache of edges whose source terminal is the key
   */
  edgesTargetTermCache = null;

  /**
   * Variable: edgeStyle
   *
   * The style to apply between cell layers to edge segments.
   * Default is <mxHierarchicalEdgeStyle.POLYLINE>.
   */
  edgeStyle = HierarchicalEdgeStyle.POLYLINE;

  /**
   * Function: getModel
   *
   * Returns the internal <mxSwimlaneModel> for this layout algorithm.
   */
  getModel() {
    return this.model;
  }

  /**
   * Function: execute
   *
   * Executes the layout for the children of the specified parent.
   *
   * Parameters:
   *
   * parent - Parent <mxCell> that contains the children to be laid out.
   * swimlanes - Ordered array of swimlanes to be laid out
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
    const dummyVertices = [];
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
   * Function: updateGroupBounds
   *
   * Updates the bounds of the given array of groups so that it includes
   * all child vertices.
   *
   */
  updateGroupBounds(): void {
    // Get all vertices and edge in the layout
    const cells = [];
    const { model } = this;

    for (const key in model.edgeMapper) {
      const edge = model.edgeMapper[key];

      for (let i = 0; i < edge.edges.length; i += 1) {
        cells.push(edge.edges[i]);
      }
    }

    let layoutBounds = this.graph.getBoundingBoxFromGeometry(cells, true);
    const childBounds = [];

    for (let i = 0; i < this.swimlanes.length; i += 1) {
      const lane = this.swimlanes[i];
      const geo = lane.getGeometry();

      if (geo != null) {
        const children = this.graph.getChildCells(lane);

        const size = this.graph.isSwimlane(lane)
          ? this.graph.getStartSize(lane)
          : new Rectangle();

        const bounds = this.graph.getBoundingBoxFromGeometry(children);
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

    for (let i = 0; i < this.swimlanes.length; i += 1) {
      const lane = this.swimlanes[i];
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
        const y = layoutBounds.y - this.parentBorder;

        newGeo.x += x;
        newGeo.y = y;

        newGeo.width = childBounds[i].width + w + this.interRankCellSpacing / 2;
        newGeo.height = layoutBounds.height + size.height + 2 * this.parentBorder;

        this.graph.model.setGeometry(lane, newGeo);
        this.graph.moveCells(children, -x, geo.y - y);
      }
    }
  }

  /**
   * Function: findRoots
   *
   * Returns all visible children in the given parent which do not have
   * incoming edges. If the result is empty then the children with the
   * maximum difference between incoming and outgoing edges are returned.
   * This takes into account edges that are being promoted to the given
   * root due to invisible children or collapsed cells.
   *
   * Parameters:
   *
   * parent - <mxCell> whose children should be checked.
   * vertices - array of vertices to limit search to
   */
  findRoots(parent: Cell, vertices: CellArray) {
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
          model.isAncestor(parent, cell)
        ) {
          const conns = this.getEdges(cell);
          let fanOut = 0;
          let fanIn = 0;

          for (let k = 0; k < conns.length; k++) {
            const src = this.getVisibleTerminal(conns[k], true);

            if (src === cell) {
              // Only count connection within this swimlane
              const other = this.getVisibleTerminal(conns[k], false);

              if (model.isAncestor(parent, other)) {
                fanOut += 1;
              }
            } else if (model.isAncestor(parent, src)) {
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
   * Function: getEdges
   *
   * Returns the connected edges for the given cell.
   *
   * Parameters:
   *
   * cell - <mxCell> whose edges should be returned.
   */
  getEdges(cell: Cell): CellArray {
    const cachedEdges = this.edgesCache.get(cell);

    if (cachedEdges != null) {
      return cachedEdges;
    }

    const { model } = this.graph;
    let edges = [];
    const isCollapsed = cell.isCollapsed();
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);

      if (this.isPort(child)) {
        edges = edges.concat(model.getEdges(child, true, true));
      } else if (isCollapsed || !child.isVisible()) {
        edges = edges.concat(model.getEdges(child, true, true));
      }
    }

    edges = edges.concat(model.getEdges(cell, true, true));
    const result = new CellArray();

    for (let i = 0; i < edges.length; i += 1) {
      const source = this.getVisibleTerminal(edges[i], true);
      const target = this.getVisibleTerminal(edges[i], false);

      if (
        source === target ||
        (source !== target &&
          ((target === cell &&
            (this.parent == null ||
              this.graph.isValidAncestor(source, this.parent, this.traverseAncestors))) ||
            (source === cell &&
              (this.parent == null ||
                this.graph.isValidAncestor(
                  target,
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
   * Function: getVisibleTerminal
   *
   * Helper function to return visible terminal for edge allowing for ports
   *
   * Parameters:
   *
   * edge - <mxCell> whose edges should be returned.
   * source - Boolean that specifies whether the source or target terminal is to be returned
   */
  getVisibleTerminal(edge: Cell, source: Cell): Cell {
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
        terminal = terminal.getParent();
      }
      terminalCache.put(edge, terminal);
    }
    return terminal;
  }

  /**
   * Function: run
   *
   * The API method used to exercise the layout upon the graph description
   * and produce a separate description of the vertex position and edge
   * routing changes made. It runs each stage of the layout that has been
   * created.
   */
  run(parent: Cell): void {
    // Separate out unconnected hierarchies
    const hierarchyVertices = [];
    const allVertexSet = Object();

    if (this.swimlanes != null && this.swimlanes.length > 0 && parent != null) {
      const filledVertexSet = Object();

      for (let i = 0; i < this.swimlanes.length; i += 1) {
        this.filterDescendants(this.swimlanes[i], filledVertexSet);
      }

      this.roots = [];
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

      for (let i = 0; i < this.roots.length; i += 1) {
        const vertexSet = Object();
        hierarchyVertices.push(vertexSet);

        this.traverse(
          this.roots[i],
          true,
          null,
          allVertexSet,
          vertexSet,
          hierarchyVertices,
          null
        );
      }
    }

    const tmp = [];

    for (var key in allVertexSet) {
      tmp.push(allVertexSet[key]);
    }

    this.model = new SwimlaneModel(this, tmp, this.roots, parent, this.tightenToSource);

    this.cycleStage(parent);
    this.layeringStage();

    this.crossingStage(parent);
    this.placementStage(0, parent);
  }

  /**
   * Function: filterDescendants
   *
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
      result[ObjectIdentity.get(cell)] = cell;
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
   * Function: isPort
   *
   * Returns true if the given cell is a "port", that is, when connecting to
   * it, its parent is the connecting vertex in terms of graph traversal
   *
   * Parameters:
   *
   * cell - <mxCell> that represents the port.
   */
  isPort(cell: Cell): boolean {
    if (cell.geometry.relative) {
      return true;
    }
    return false;
  }

  /**
   * Function: getEdgesBetween
   *
   * Returns the edges between the given source and target. This takes into
   * account collapsed and invisible cells and ports.
   *
   * Parameters:
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
   * Parameters:
   *
   * vertex - <mxCell> that represents the vertex where the traversal starts.
   * directed - boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * edge - Optional <mxCell> that represents the incoming edge. This is
   * null for the first step of the traversal.
   * allVertices - Array of cell paths for the visited cells.
   * swimlaneIndex - the laid out order index of the swimlane vertex is contained in
   */
  traverse(
    vertex: Cell,
    directed: boolean,
    edge: Cell,
    allVertices: { [key: string]: Cell },
    currentComp,
    hierarchyVertices,
    filledVertexSet,
    swimlaneIndex
  ) {
    if (vertex != null && allVertices != null) {
      // Has this vertex been seen before in any traversal
      // And if the filled vertex set is populated, only
      // process vertices in that it contains
      const vertexID = ObjectIdentity.get(vertex);

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
          // Get the swimlane index of the other terminal
          for (otherIndex = 0; otherIndex < this.swimlanes.length; otherIndex++) {
            if (model.isAncestor(this.swimlanes[otherIndex], otherVertex)) {
              break;
            }
          }

          if (otherIndex >= this.swimlanes.length) {
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
              otherVertex,
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

          if (comp[vertexID] != null) {
            for (const key in comp) {
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
   * Function: cycleStage
   *
   * Executes the cycle stage using mxMinimumCycleRemover.
   */
  cycleStage(parent: Cell) {
    const cycleStage = new mxSwimlaneOrdering(this);
    cycleStage.execute(parent);
  }

  /**
   * Function: layeringStage
   *
   * Implements first stage of a Sugiyama layout.
   */
  layeringStage(): void {
    this.model.initialRank();
    this.model.fixRanks();
  }

  /**
   * Function: crossingStage
   *
   * Executes the crossing stage using mxMedianHybridCrossingReduction.
   */
  crossingStage(parent: Cell): void {
    const crossingStage = new MedianHybridCrossingReduction(this);
    crossingStage.execute(parent);
  }

  /**
   * Function: placementStage
   *
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

    return placementStage.limitX + this.interHierarchySpacing;
  }
}

export default SwimlaneLayout;
