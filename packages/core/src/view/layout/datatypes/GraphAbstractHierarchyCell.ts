/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import Cell from '../../cell/Cell';

class GraphAbstractHierarchyCell extends Cell {
  swimlaneIndex: number | null = null;

  /**
   * The maximum rank this cell occupies. Default is -1.
   */
  maxRank = -1;

  /**
   * The minimum rank this cell occupies. Default is -1.
   */
  minRank = -1;

  /**
   * The x position of this cell for each layer it occupies
   */
  x: number[];

  /**
   * The y position of this cell for each layer it occupies
   */
  y: number[];

  /**
   * The width of this cell. Default is 0.
   */
  width = 0;

  /**
   * The height of this cell. Default is 0.
   */
  height = 0;

  /**
   * A cached version of the cells this cell connects to on the next layer up
   */
  nextLayerConnectedCells: { [key: number]: GraphAbstractHierarchyCell[] } | null = null;

  /**
   * A cached version of the cells this cell connects to on the next layer down
   */
  previousLayerConnectedCells: { [key: number]: GraphAbstractHierarchyCell[] } | null = null;

  /**
   * Temporary variable for general use. Generally, try to avoid
   * carrying information between stages. Currently, the longest
   * path layering sets temp to the rank position in fixRanks()
   * and the crossing reduction uses this. This meant temp couldn't
   * be used for hashing the nodes in the model dfs and so hashCode
   * was created
   */
  temp: number[];

  /**
   * Class: mxGraphAbstractHierarchyCell
   *
   * An abstraction of an internal hierarchy node or edge
   *
   * Constructor: mxGraphAbstractHierarchyCell
   *
   * Constructs a new hierarchical layout algorithm.
   */
  constructor() {
    super();

    this.x = [];
    this.y = [];
    this.temp = [];
  }

  /**
   * Returns the cells this cell connects to on the next layer up
   */
  getNextLayerConnectedCells(layer: number): GraphAbstractHierarchyCell[] | null {
    return null;
  }

  /**
   * Returns the cells this cell connects to on the next layer down
   */
  getPreviousLayerConnectedCells(layer: number): GraphAbstractHierarchyCell[] | null {
    return null;
  }

  /**
   * Returns whether or not this cell is an edge
   */
  isEdge() {
    return false;
  }

  /**
   * Returns whether or not this cell is a node
   */
  isVertex() {
    return false;
  }

  /**
   * Gets the value of temp for the specified layer
   */
  getGeneralPurposeVariable(layer: number): number | null {
    return null;
  }

  /**
   * Set the value of temp for the specified layer
   */
  setGeneralPurposeVariable(layer: number, value: number) {}

  /**
   * Set the value of x for the specified layer
   */
  setX(layer: number, value: number) {
    if (this.isVertex()) {
      this.x[0] = value;
    } else if (this.isEdge()) {
      this.x[layer - this.minRank - 1] = value;
    }
  }

  /**
   * Gets the value of x on the specified layer
   */
  getX(layer: number) {
    if (this.isVertex()) {
      return this.x[0];
    }
    if (this.isEdge()) {
      return this.x[layer - this.minRank - 1];
    }
    return 0.0;
  }

  /**
   * Set the value of y for the specified layer
   */
  setY(layer: number, value: number) {
    if (this.isVertex()) {
      this.y[0] = value;
    } else if (this.isEdge()) {
      this.y[layer - this.minRank - 1] = value;
    }
  }
}

export default GraphAbstractHierarchyCell;
