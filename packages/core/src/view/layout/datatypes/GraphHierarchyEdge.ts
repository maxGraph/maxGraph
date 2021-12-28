/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import GraphAbstractHierarchyCell from './GraphAbstractHierarchyCell';
import ObjectIdentity from '../../../util/ObjectIdentity';
import CellArray from '../../cell/CellArray';
import Cell from '../../cell/Cell';
import GraphHierarchyNode from './GraphHierarchyNode';

class GraphHierarchyEdge extends GraphAbstractHierarchyCell {
  /**
   * The graph edge(s) this object represents. Parallel edges are all grouped
   * together within one hierarchy edge.
   */
  edges: CellArray;

  /**
   * The object identities of the wrapped cells
   */
  ids: string[];

  /**
   * The node this edge is sourced at
   */
  source: GraphHierarchyNode | null = null;

  /**
   * The node this edge targets
   */
  target: GraphHierarchyNode | null = null;

  /**
   * Whether or not the direction of this edge has been reversed
   * internally to create a DAG for the hierarchical layout
   */
  isReversed: boolean = false;

  /**
   * Class: mxGraphHierarchyEdge
   *
   * An abstraction of a hierarchical edge for the hierarchy layout
   *
   * Constructor: mxGraphHierarchyEdge
   *
   * Constructs a hierarchy edge
   *
   * Arguments:
   *
   * edges - a list of real graph edges this abstraction represents
   */
  constructor(edges: CellArray) {
    super();
    this.edges = edges;
    this.ids = [];

    for (let i = 0; i < edges.length; i += 1) {
      this.ids.push(<string>ObjectIdentity.get(edges[i]));
    }
  }

  /**
   * Inverts the direction of this internal edge(s)
   */
  invert() {
    const temp = this.source;
    this.source = this.target;
    this.target = temp;
    this.isReversed = !this.isReversed;
  }

  /**
   * Returns the cells this cell connects to on the next layer up
   */
  getNextLayerConnectedCells(layer: number): GraphAbstractHierarchyCell[] {
    if (this.nextLayerConnectedCells == null) {
      this.nextLayerConnectedCells = [];

      for (let i = 0; i < this.temp.length; i += 1) {
        this.nextLayerConnectedCells[i] = [];

        if (i === this.temp.length - 1) {
          this.nextLayerConnectedCells[i].push(this.source as GraphAbstractHierarchyCell);
        } else {
          this.nextLayerConnectedCells[i].push(this);
        }
      }
    }
    return this.nextLayerConnectedCells[layer - this.minRank - 1];
  }

  /**
   * Returns the cells this cell connects to on the next layer down
   */
  getPreviousLayerConnectedCells(layer: number) {
    if (this.previousLayerConnectedCells == null) {
      this.previousLayerConnectedCells = [];

      for (let i = 0; i < this.temp.length; i += 1) {
        this.previousLayerConnectedCells[i] = [];

        if (i === 0) {
          this.previousLayerConnectedCells[i].push(this.target as GraphAbstractHierarchyCell);
        } else {
          this.previousLayerConnectedCells[i].push(this);
        }
      }
    }
    return this.previousLayerConnectedCells[layer - this.minRank - 1];
  }

  /**
   * Returns true.
   */
  isEdge() {
    return true;
  }

  /**
   * Gets the value of temp for the specified layer
   */
  getGeneralPurposeVariable(layer: number) {
    return this.temp[layer - this.minRank - 1];
  }

  /**
   * Set the value of temp for the specified layer
   */
  setGeneralPurposeVariable(layer: number, value: number) {
    this.temp[layer - this.minRank - 1] = value;
  }

  /**
   * Gets the first core edge associated with this wrapper
   */
  getCoreCell() {
    if (this.edges.length > 0) {
      return this.edges[0];
    }
    return null;
  }
}

export default GraphHierarchyEdge;
