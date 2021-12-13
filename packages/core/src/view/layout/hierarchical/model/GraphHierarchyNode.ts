/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import GraphAbstractHierarchyCell from './GraphAbstractHierarchyCell';
import ObjectIdentity from '../../../../util/ObjectIdentity';
import CellArray from '../../../cell/CellArray';
import Cell from '../../../cell/Cell';
import GraphHierarchyEdge from './GraphHierarchyEdge';

/**
 * Class: mxGraphHierarchyNode
 *
 * An abstraction of a hierarchical edge for the hierarchy layout
 *
 * Constructor: mxGraphHierarchyNode
 *
 * Constructs an internal node to represent the specified real graph cell
 *
 * Arguments:
 *
 * cell - the real graph cell this node represents
 */
class GraphHierarchyNode extends GraphAbstractHierarchyCell {
  constructor(cell: Cell) {
    super();
    this.cell = cell;
    this.id = ObjectIdentity.get(cell);
    this.connectsAsTarget = [];
    this.connectsAsSource = [];
  }

  /**
   * Variable: cell
   *
   * The graph cell this object represents.
   */
  cell: Cell | null = null;

  /**
   * Variable: id
   *
   * The object identity of the wrapped cell
   */
  id: string | null = null;

  /**
   * Variable: connectsAsTarget
   *
   * Collection of hierarchy edges that have this node as a target
   */
  connectsAsTarget: GraphHierarchyEdge[] | null = null;

  /**
   * Variable: connectsAsSource
   *
   * Collection of hierarchy edges that have this node as a source
   */
  connectsAsSource: GraphHierarchyEdge[] | null = null;

  /**
   * Variable: hashCode
   *
   * Assigns a unique hashcode for each node. Used by the model dfs instead
   * of copying HashSets
   */
  hashCode: any = false;

  /**
   * Function: getRankValue
   *
   * Returns the integer value of the layer that this node resides in
   */
  getRankValue(layer: number): number {
    return this.maxRank;
  }

  /**
   * Function: getNextLayerConnectedCells
   *
   * Returns the cells this cell connects to on the next layer up
   */
  getNextLayerConnectedCells(layer: number): CellArray {
    if (this.nextLayerConnectedCells == null) {
      this.nextLayerConnectedCells = [];
      this.nextLayerConnectedCells[0] = [];

      for (let i = 0; i < this.connectsAsTarget.length; i += 1) {
        const edge = this.connectsAsTarget[i];

        if (edge.maxRank === -1 || edge.maxRank === layer + 1) {
          // Either edge is not in any rank or
          // no dummy nodes in edge, add node of other side of edge
          this.nextLayerConnectedCells[0].push(<Cell>edge.source);
        } else {
          // Edge spans at least two layers, add edge
          this.nextLayerConnectedCells[0].push(edge);
        }
      }
    }
    return this.nextLayerConnectedCells[0];
  }

  /**
   * Function: getPreviousLayerConnectedCells
   *
   * Returns the cells this cell connects to on the next layer down
   */
  getPreviousLayerConnectedCells(layer: number): CellArray {
    if (this.previousLayerConnectedCells == null) {
      this.previousLayerConnectedCells = [];
      this.previousLayerConnectedCells[0] = []; // new CellArray()??

      for (let i = 0; i < this.connectsAsSource.length; i += 1) {
        const edge = this.connectsAsSource[i];

        if (edge.minRank === -1 || edge.minRank === layer - 1) {
          // No dummy nodes in edge, add node of other side of edge
          this.previousLayerConnectedCells[0].push(<Cell>edge.target);
        } else {
          // Edge spans at least two layers, add edge
          this.previousLayerConnectedCells[0].push(edge);
        }
      }
    }
    return this.previousLayerConnectedCells[0];
  }

  /**
   * Function: isVertex
   *
   * Returns true.
   */
  isVertex(): boolean {
    return true;
  }

  /**
   * Function: getGeneralPurposeVariable
   *
   * Gets the value of temp for the specified layer
   */
  getGeneralPurposeVariable(layer: number): any {
    return this.temp[0];
  }

  /**
   * Function: setGeneralPurposeVariable
   *
   * Set the value of temp for the specified layer
   */
  setGeneralPurposeVariable(layer: number, value: number): void {
    this.temp[0] = value;
  }

  /**
   * Function: isAncestor
   */
  isAncestor(otherNode: GraphHierarchyNode): boolean {
    // Firstly, the hash code of this node needs to be shorter than the
    // other node
    if (
      otherNode != null &&
      this.hashCode != null &&
      otherNode.hashCode != null &&
      this.hashCode.length < otherNode.hashCode.length
    ) {
      if (this.hashCode === otherNode.hashCode) {
        return true;
      }

      if (this.hashCode == null || this.hashCode == null) {
        return false;
      }

      // Secondly, this hash code must match the start of the other
      // node's hash code. Arrays.equals cannot be used here since
      // the arrays are different length, and we do not want to
      // perform another array copy.
      for (let i = 0; i < this.hashCode.length; i += 1) {
        if (this.hashCode[i] !== otherNode.hashCode[i]) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Function: getCoreCell
   *
   * Gets the core vertex associated with this wrapper
   */
  getCoreCell(): Cell {
    return <Cell>this.cell;
  }
}

export default GraphHierarchyNode;
