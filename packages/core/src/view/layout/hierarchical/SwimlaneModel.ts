/*
Copyright 2021-present The maxGraph project Contributors
Copyright (c) 2006-2018, JGraph Ltd
Copyright (c) 2006-2018, Gaudenz Alder

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

import GraphHierarchyNode from '../datatypes/GraphHierarchyNode';
import GraphHierarchyEdge from '../datatypes/GraphHierarchyEdge';
import CellPath from '../../cell/CellPath';
import Dictionary from '../../../util/Dictionary';
import Cell from '../../cell/Cell';
import { clone } from '../../../util/cloneUtils';
import SwimlaneLayout from '../SwimlaneLayout';

/**
 * Internal model of a hierarchical graph. This model stores nodes and edges
 * equivalent to the real graph nodes and edges, but also stores the rank of the
 * cells, the order within the ranks and the new candidate locations of cells.
 * The internal model also reverses edge direction were appropriate , ignores
 * self-loop and groups parallels together under one edge object.
 *
 * @category Layout
 */
class SwimlaneModel {
  /**
   * Creates an internal ordered graph model using the vertices passed in. If
   * there are any, leftward edge need to be inverted in the internal model.
   *
   * @param layout
   * @param vertices the vertices for this hierarchy
   * @param roots
   * @param parent
   * @param tightenToSource whether or not to tighten vertices towards the sources
   */
  constructor(
    layout: SwimlaneLayout,
    vertices: Cell[],
    roots: Cell[],
    parent: Cell,
    tightenToSource: boolean
  ) {
    const graph = layout.getGraph();
    this.tightenToSource = tightenToSource;
    this.roots = roots;
    this.parent = parent;

    // map of cells to internal cell needed for second run through
    // to setup the sink of edges correctly
    this.vertexMapper = new Dictionary();
    this.edgeMapper = new Dictionary();
    this.maxRank = 0;
    const internalVertices: GraphHierarchyNode[] = [];

    if (vertices == null) {
      vertices = graph.getChildVertices(parent);
    }

    this.maxRank = this.SOURCESCANSTARTRANK;
    // map of cells to internal cell needed for second run through
    // to setup the sink of edges correctly. Guess size by number
    // of edges is roughly same as number of vertices.
    this.createInternalCells(layout, vertices, internalVertices);

    // Go through edges set their sink values. Also check the
    // ordering if and invert edges if necessary
    for (let i = 0; i < vertices.length; i += 1) {
      const edges = internalVertices[i].connectsAsSource;

      for (let j = 0; j < edges.length; j++) {
        const internalEdge = edges[j];
        const realEdges = internalEdge.edges;

        // Only need to process the first real edge, since
        // all the edges connect to the same other vertex
        if (realEdges != null && realEdges.length > 0) {
          const realEdge = realEdges[0];
          let targetCell = <Cell>layout.getVisibleTerminal(realEdge, false);
          let internalTargetCell = <GraphHierarchyNode>this.vertexMapper.get(targetCell);

          if (internalVertices[i] == internalTargetCell) {
            // If there are parallel edges going between two vertices and not all are in the same direction
            // you can have navigated across one direction when doing the cycle reversal that isn't the same
            // direction as the first real edge in the array above. When that happens the if above catches
            // that and we correct the target cell before continuing.
            // This branch only detects this single case
            targetCell = <Cell>layout.getVisibleTerminal(realEdge, true);
            internalTargetCell = <GraphHierarchyNode>this.vertexMapper.get(targetCell);
          }

          if (internalTargetCell != null && internalVertices[i] !== internalTargetCell) {
            internalEdge.target = internalTargetCell;

            if (internalTargetCell.connectsAsTarget.length == 0) {
              internalTargetCell.connectsAsTarget = [];
            }

            if (internalTargetCell.connectsAsTarget.indexOf(internalEdge) < 0) {
              internalTargetCell.connectsAsTarget.push(internalEdge);
            }
          }
        }
      }

      // Use the temp variable in the internal nodes to mark this
      // internal vertex as having been visited.
      internalVertices[i].temp[0] = 1;
    }
  }

  /**
   * Stores the largest rank number allocated
   */
  maxRank: number;

  /**
   * Map from graph vertices to internal model nodes.
   */
  vertexMapper: Dictionary<Cell, GraphHierarchyNode>;

  /**
   * Map from graph edges to internal model edges
   */
  edgeMapper: Dictionary<Cell, GraphHierarchyEdge>;

  /**
   * Mapping from rank number to actual rank
   */
  ranks: GraphHierarchyNode[][] = [];

  /**
   * Store of roots of this hierarchy model, these are real graph cells, not
   * internal cells
   */
  roots: Cell[];

  /**
   * The parent cell whose children are being laid out
   */
  parent: Cell;

  /**
   * Count of the number of times the ancestor dfs has been used.
   */
  dfsCount = 0;

  /**
   * High value to start source layering scan rank value from.
   */
  SOURCESCANSTARTRANK = 100000000;

  /**
   * Whether or not to tighten the assigned ranks of vertices up towards
   * the source cells.
   */
  tightenToSource = false;

  /**
   * An array of the number of ranks within each swimlane
   */
  ranksPerGroup: number[] | null = null;

  /**
   * Creates all edges in the internal model
   *
   * @param layout Reference to the <HierarchicalLayout> algorithm.
   * @param vertices Array of {@link Cells} that represent the vertices whom are to
   * have an internal representation created.
   * @param internalVertices The array of {@link GraphHierarchyNodes} to have their
   * information filled in using the real vertices.
   */
  createInternalCells(
    layout: SwimlaneLayout,
    vertices: Cell[],
    internalVertices: GraphHierarchyNode[]
  ): void {
    const graph = layout.getGraph();
    const swimlanes = layout.swimlanes as Cell[];

    // Create internal edges
    for (let i = 0; i < vertices.length; i += 1) {
      internalVertices[i] = new GraphHierarchyNode(vertices[i]);
      this.vertexMapper.put(vertices[i], internalVertices[i]);
      internalVertices[i].swimlaneIndex = -1;

      for (let ii = 0; ii < swimlanes.length; ii += 1) {
        if (vertices[i].getParent() === swimlanes[ii]) {
          internalVertices[i].swimlaneIndex = ii;
          break;
        }
      }

      // If the layout is deterministic, order the cells
      // List outgoingCells = graph.getNeighbours(vertices[i], deterministic);
      const conns = layout.getEdges(vertices[i]);
      internalVertices[i].connectsAsSource = [];

      // Create internal edges, but don't do any rank assignment yet
      // First use the information from the greedy cycle remover to
      // invert the leftward edges internally
      for (let j = 0; j < conns.length; j += 1) {
        const cell = <Cell>layout.getVisibleTerminal(conns[j], false);

        // Looking for outgoing edges only
        if (cell !== vertices[i] && cell.isVertex() && !layout.isVertexIgnored(cell)) {
          // We process all edge between this source and its targets
          // If there are edges going both ways, we need to collect
          // them all into one internal edges to avoid looping problems
          // later. We assume this direction (source -> target) is the
          // natural direction if at least half the edges are going in
          // that direction.

          // The check below for edges[0] being in the vertex mapper is
          // in case we've processed this the other way around
          // (target -> source) and the number of edges in each direction
          // are the same. All the graph edges will have been assigned to
          // an internal edge going the other way, so we don't want to
          // process them again
          const undirectedEdges = layout.getEdgesBetween(vertices[i], cell, false);
          const directedEdges = layout.getEdgesBetween(vertices[i], cell, true);

          if (
            undirectedEdges != null &&
            undirectedEdges.length > 0 &&
            this.edgeMapper.get(undirectedEdges[0]) == null &&
            directedEdges.length * 2 >= undirectedEdges.length
          ) {
            const internalEdge = new GraphHierarchyEdge(undirectedEdges);

            for (let k = 0; k < undirectedEdges.length; k += 1) {
              const edge = undirectedEdges[k];
              this.edgeMapper.put(edge, internalEdge);

              // Resets all point on the edge and disables the edge style
              // without deleting it from the cell style
              graph.resetEdge(edge);

              if (layout.disableEdgeStyle) {
                layout.setEdgeStyleEnabled(edge, false);
                layout.setOrthogonalEdge(edge, true);
              }
            }

            internalEdge.source = internalVertices[i];

            if (internalVertices[i].connectsAsSource.indexOf(internalEdge) < 0) {
              internalVertices[i].connectsAsSource.push(internalEdge);
            }
          }
        }
      }

      // Ensure temp variable is cleared from any previous use
      internalVertices[i].temp[0] = 0;
    }
  }

  /**
   * Basic determination of minimum layer ranking by working from from sources
   * or sinks and working through each node in the relevant edge direction.
   * Starting at the sinks is basically a longest path layering algorithm.
   */
  initialRank(): void {
    this.ranksPerGroup = [];

    const startNodes: GraphHierarchyNode[] = [];
    const seen = {};

    if (this.roots != null) {
      for (let i = 0; i < this.roots.length; i += 1) {
        const internalNode = <GraphHierarchyNode>this.vertexMapper.get(this.roots[i]);
        this.maxChainDfs(null, internalNode, null, seen, 0);

        if (internalNode != null) {
          startNodes.push(internalNode);
        }
      }
    }

    // Calculate the lower and upper rank bounds of each swimlane
    const lowerRank: { [key: number]: number } = {};
    const upperRank: { [key: number]: number } = {};

    for (let i = this.ranksPerGroup.length - 1; i >= 0; i--) {
      if (i === this.ranksPerGroup.length - 1) {
        lowerRank[i] = 0;
      } else {
        lowerRank[i] = upperRank[i + 1] + 1;
      }

      upperRank[i] = lowerRank[i] + this.ranksPerGroup[i];
    }

    this.maxRank = upperRank[0];

    const internalNodes = this.vertexMapper.getValues();

    for (let i = 0; i < internalNodes.length; i += 1) {
      // Mark the node as not having had a layer assigned
      internalNodes[i].temp[0] = -1;
    }

    const startNodesCopy = startNodes.slice();

    while (startNodes.length > 0) {
      const internalNode = startNodes[0];
      const layerDeterminingEdges = internalNode.connectsAsTarget;
      const edgesToBeMarked = internalNode.connectsAsSource;

      // flag to keep track of whether or not all layer determining
      // edges have been scanned
      let allEdgesScanned = true;

      // Work out the layer of this node from the layer determining
      // edges. The minimum layer number of any node connected by one of
      // the layer determining edges variable
      let minimumLayer = upperRank[0];

      for (let i = 0; i < layerDeterminingEdges.length; i += 1) {
        const internalEdge = layerDeterminingEdges[i];

        if (internalEdge.temp[0] === 5270620) {
          // This edge has been scanned, get the layer of the
          // node on the other end
          const otherNode = <GraphHierarchyNode>internalEdge.source;
          minimumLayer = Math.min(minimumLayer, otherNode.temp[0] - 1);
        } else {
          allEdgesScanned = false;

          break;
        }
      }

      // If all edge have been scanned, assign the layer, mark all
      // edges in the other direction and remove from the nodes list
      if (allEdgesScanned) {
        if (minimumLayer > upperRank[<number>internalNode.swimlaneIndex]) {
          minimumLayer = upperRank[<number>internalNode.swimlaneIndex];
        }

        internalNode.temp[0] = minimumLayer;

        if (edgesToBeMarked != null) {
          for (let i = 0; i < edgesToBeMarked.length; i += 1) {
            const internalEdge = edgesToBeMarked[i];

            // Assign unique stamp ( y/m/d/h )
            internalEdge.temp[0] = 5270620;

            // Add node on other end of edge to LinkedList of
            // nodes to be analysed
            const otherNode = <GraphHierarchyNode>internalEdge.target;

            // Only add node if it hasn't been assigned a layer
            if (otherNode.temp[0] === -1) {
              startNodes.push(otherNode);

              // Mark this other node as neither being
              // unassigned nor assigned so it isn't
              // added to this list again, but it's
              // layer isn't used in any calculation.
              otherNode.temp[0] = -2;
            }
          }
        }

        startNodes.shift();
      } else {
        // Not all the edges have been scanned, get to the back of
        // the class and put the dunces cap on
        const removedCell = startNodes.shift();
        startNodes.push(internalNode);

        if (removedCell === internalNode && startNodes.length === 1) {
          // This is an error condition, we can't get out of
          // this loop. It could happen for more than one node
          // but that's a lot harder to detect. Log the error
          // TODO make log comment
          break;
        }
      }
    }

    // Normalize the ranks down from their large starting value to place
    // at least 1 sink on layer 0
    //  for (var key in this.vertexMapper)
    //  {
    //    let internalNode = this.vertexMapper[key];
    //    // Mark the node as not having had a layer assigned
    //    internalNode.temp[0] -= this.maxRank;
    //  }

    // Tighten the rank 0 nodes as far as possible
    //  for ( let i = 0; i < startNodesCopy.length; i += 1)
    //  {
    //    let internalNode = startNodesCopy[i];
    //    let currentMaxLayer = 0;
    //    let layerDeterminingEdges = internalNode.connectsAsSource;
    //
    //    for ( let j = 0; j < layerDeterminingEdges.length; j++)
    //    {
    //      let internalEdge = layerDeterminingEdges[j];
    //      let otherNode = internalEdge.target;
    //      internalNode.temp[0] = Math.max(currentMaxLayer,
    //          otherNode.temp[0] + 1);
    //      currentMaxLayer = internalNode.temp[0];
    //    }
    //  }
  }

  /**
   * Performs a depth first search on the internal hierarchy model. This dfs
   * extends the default version by keeping track of chains within groups.
   * Any cycles should be removed prior to running, but previously seen cells
   * are ignored.
   *
   * @param parent the parent internal node of the current internal node
   * @param root the current internal node
   * @param connectingEdge the internal edge connecting the internal node and the parent
   * internal node, if any
   * @param seen a set of all nodes seen by this dfs
   * @param chainCount the number of edges in the chain of vertices going through
   * the current swimlane
   */
  maxChainDfs(
    parent: GraphHierarchyNode | null,
    root: GraphHierarchyNode,
    connectingEdge: GraphHierarchyEdge | null,
    seen: { [key: string]: Cell },
    chainCount: number
  ) {
    if (root != null) {
      const rootId = <string>CellPath.create(root.cell);

      if (seen[rootId] == null) {
        seen[rootId] = root;
        const slIndex = <number>root.swimlaneIndex;
        const ranksPerGroup = <{ [key: number]: number }>this.ranksPerGroup;

        if (ranksPerGroup[slIndex] == null || ranksPerGroup[slIndex] < chainCount) {
          ranksPerGroup[slIndex] = chainCount;
        }

        // Copy the connects as source list so that visitors
        // can change the original for edge direction inversions
        const outgoingEdges = root.connectsAsSource.slice();

        for (let i = 0; i < outgoingEdges.length; i += 1) {
          const internalEdge = <GraphHierarchyEdge>outgoingEdges[i];
          const targetNode = <GraphHierarchyNode>internalEdge.target;

          // Only navigate in source->target direction within the same
          // swimlane, or from a lower index swimlane to a higher one
          if (<number>root.swimlaneIndex < <number>targetNode.swimlaneIndex) {
            this.maxChainDfs(root, targetNode, internalEdge, clone(seen, null, true), 0);
          } else if (root.swimlaneIndex === targetNode.swimlaneIndex) {
            this.maxChainDfs(
              root,
              targetNode,
              internalEdge,
              clone(seen, null, true),
              chainCount + 1
            );
          }
        }
      }
    }
  }

  /**
   * Fixes the layer assignments to the values stored in the nodes. Also needs
   * to create dummy nodes for edges that cross layers.
   */
  fixRanks(): void {
    const rankList: GraphHierarchyNode[][] = [];
    this.ranks = [];

    for (let i = 0; i < this.maxRank + 1; i += 1) {
      rankList[i] = [];
      this.ranks[i] = rankList[i];
    }

    // Perform a DFS to obtain an initial ordering for each rank.
    // Without doing this you would end up having to process
    // crossings for a standard tree.
    let rootsArray: GraphHierarchyNode[] | null = null;

    if (this.roots != null) {
      const oldRootsArray = this.roots;
      rootsArray = [];

      for (let i = 0; i < oldRootsArray.length; i += 1) {
        const cell = oldRootsArray[i];
        const internalNode = <GraphHierarchyNode>this.vertexMapper.get(cell);
        rootsArray[i] = internalNode;
      }
    }

    this.visit(
      (
        parent: GraphHierarchyNode,
        node: GraphHierarchyNode,
        edge: GraphHierarchyNode,
        layer: number,
        seen: number
      ) => {
        if (seen === 0 && node.maxRank < 0 && node.minRank < 0) {
          rankList[node.temp[0]].push(node);
          node.maxRank = node.temp[0];
          node.minRank = node.temp[0];

          // Set temp[0] to the nodes position in the rank
          node.temp[0] = rankList[node.maxRank].length - 1;
        }

        if (parent != null && edge != null) {
          const parentToCellRankDifference = parent.maxRank - node.maxRank;

          if (parentToCellRankDifference > 1) {
            // There are ranks in between the parent and current cell
            edge.maxRank = parent.maxRank;
            edge.minRank = node.maxRank;
            edge.temp = [];
            edge.x = [];
            edge.y = [];

            for (let i = edge.minRank + 1; i < edge.maxRank; i += 1) {
              // The connecting edge must be added to the
              // appropriate ranks
              rankList[i].push(edge);
              edge.setGeneralPurposeVariable(i, rankList[i].length - 1);
            }
          }
        }
      },
      rootsArray,
      false,
      null
    );
  }

  /**
   * A depth first search through the internal heirarchy model.
   *
   * @param visitor The visitor function pattern to be called for each node.
   * @param trackAncestors Whether or not the search is to keep track all nodes
   * directly above this one in the search path.
   */
  visit(
    visitor: Function,
    dfsRoots: GraphHierarchyNode[] | null,
    trackAncestors: boolean,
    seenNodes: { [key: string]: Cell } | null
  ) {
    // Run dfs through on all roots
    if (dfsRoots != null) {
      for (let i = 0; i < dfsRoots.length; i += 1) {
        const internalNode = dfsRoots[i];

        if (internalNode != null) {
          if (seenNodes == null) {
            seenNodes = {};
          }

          if (trackAncestors) {
            // Set up hash code for root
            internalNode.hashCode = [];
            internalNode.hashCode[0] = this.dfsCount;
            internalNode.hashCode[1] = i;
            this.extendedDfs(
              null,
              internalNode,
              null,
              visitor,
              seenNodes,
              internalNode.hashCode,
              i,
              0
            );
          } else {
            this.dfs(null, internalNode, null, visitor, seenNodes, 0);
          }
        }
      }

      this.dfsCount += 1;
    }
  }

  /**
   * Performs a depth first search on the internal hierarchy model
   *
   * @param parent the parent internal node of the current internal node
   * @param root the current internal node
   * @param connectingEdge the internal edge connecting the internal node and the parent
   * internal node, if any
   * @param visitor the visitor pattern to be called for each node
   * @param seen a set of all nodes seen by this dfs a set of all of the
   * ancestor node of the current node
   * @param layer the layer on the dfs tree ( not the same as the model ranks )
   */
  dfs(
    parent: Cell | null,
    root: GraphHierarchyNode,
    connectingEdge: Cell | null,
    visitor: Function,
    seen: { [key: string]: Cell },
    layer: number
  ) {
    if (root != null) {
      const rootId = <string>root.id;

      if (seen[rootId] == null) {
        seen[rootId] = root;
        visitor(parent, root, connectingEdge, layer, 0);

        // Copy the connects as source list so that visitors
        // can change the original for edge direction inversions
        const outgoingEdges = root.connectsAsSource.slice();

        for (let i = 0; i < outgoingEdges.length; i += 1) {
          const internalEdge = outgoingEdges[i];
          const targetNode = <GraphHierarchyNode>internalEdge.target;

          // Root check is O(|roots|)
          this.dfs(root, targetNode, internalEdge, visitor, seen, layer + 1);
        }
      } else {
        // Use the int field to indicate this node has been seen
        visitor(parent, root, connectingEdge, layer, 1);
      }
    }
  }

  /**
   * Performs a depth first search on the internal hierarchy model. This dfs
   * extends the default version by keeping track of cells ancestors, but it
   * should be only used when necessary because of it can be computationally
   * intensive for deep searches.
   *
   * @param parent the parent internal node of the current internal node
   * @param root the current internal node
   * @param connectingEdge the internal edge connecting the internal node and the parent
   * internal node, if any
   * @param visitor the visitor pattern to be called for each node
   * @param seen a set of all nodes seen by this dfs
   * @param ancestors the parent hash code
   * @param childHash the new hash code for this node
   * @param layer the layer on the dfs tree ( not the same as the model ranks )
   */
  extendedDfs(
    parent: GraphHierarchyNode | null,
    root: GraphHierarchyNode,
    connectingEdge: Cell | null,
    visitor: Function,
    seen: { [key: string]: Cell },
    ancestors: any,
    childHash: string | number,
    layer: number
  ) {
    // Explanation of custom hash set. Previously, the ancestors variable
    // was passed through the dfs as a HashSet. The ancestors were copied
    // into a new HashSet and when the new child was processed it was also
    // added to the set. If the current node was in its ancestor list it
    // meant there is a cycle in the graph and this information is passed
    // to the visitor.visit() in the seen parameter. The HashSet clone was
    // very expensive on CPU so a custom hash was developed using primitive
    // types. temp[] couldn't be used so hashCode[] was added to each node.
    // Each new child adds another int to the array, copying the prefix
    // from its parent. Child of the same parent add different ints (the
    // limit is therefore 2^32 children per parent...). If a node has a
    // child with the hashCode already set then the child code is compared
    // to the same portion of the current nodes array. If they match there
    // is a loop.
    // Note that the basic mechanism would only allow for 1 use of this
    // functionality, so the root nodes have two ints. The second int is
    // incremented through each node root and the first is incremented
    // through each run of the dfs algorithm (therefore the dfs is not
    // thread safe). The hash code of each node is set if not already set,
    // or if the first int does not match that of the current run.
    if (root != null) {
      if (parent != null) {
        // Form this nodes hash code if necessary, that is, if the
        // hashCode variable has not been initialized or if the
        // start of the parent hash code does not equal the start of
        // this nodes hash code, indicating the code was set on a
        // previous run of this dfs.
        if (root.hashCode == null || root.hashCode[0] !== parent.hashCode[0]) {
          const hashCodeLength = parent.hashCode.length + 1;
          root.hashCode = parent.hashCode.slice();
          root.hashCode[hashCodeLength - 1] = childHash;
        }
      }

      const rootId = <string>root.id;

      if (seen[rootId] == null) {
        seen[rootId] = root;
        visitor(parent, root, connectingEdge, layer, 0);

        // Copy the connects as source list so that visitors
        // can change the original for edge direction inversions
        const outgoingEdges = root.connectsAsSource.slice();
        const incomingEdges = root.connectsAsTarget.slice();

        for (let i = 0; i < outgoingEdges.length; i += 1) {
          const internalEdge = outgoingEdges[i];
          const targetNode = <GraphHierarchyNode>internalEdge.target;

          // Only navigate in source->target direction within the same
          // swimlane, or from a lower index swimlane to a higher one
          if (<number>root.swimlaneIndex <= <number>targetNode.swimlaneIndex) {
            this.extendedDfs(
              root,
              targetNode,
              internalEdge,
              visitor,
              seen,
              root.hashCode,
              i,
              layer + 1
            );
          }
        }

        for (let i = 0; i < incomingEdges.length; i += 1) {
          const internalEdge = incomingEdges[i];
          const targetNode = <GraphHierarchyNode>internalEdge.source;

          // Only navigate in target->source direction from a lower index
          // swimlane to a higher one
          if (<number>root.swimlaneIndex < <number>targetNode.swimlaneIndex) {
            this.extendedDfs(
              root,
              targetNode,
              internalEdge,
              visitor,
              seen,
              root.hashCode,
              i,
              layer + 1
            );
          }
        }
      } else {
        // Use the int field to indicate this node has been seen
        visitor(parent, root, connectingEdge, layer, 1);
      }
    }
  }
}

export default SwimlaneModel;
