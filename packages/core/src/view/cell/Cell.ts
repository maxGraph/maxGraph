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

import Geometry from '../geometry/Geometry';
import CellOverlay from './CellOverlay';
import { clone } from '../../util/cloneUtils';
import Point from '../geometry/Point';
import CellPath from './CellPath';
import type { CellStyle, FilterFunction, IdentityObject } from '../../types';
import type { UserObject } from '../../internal/types';
import { isElement, isNullish } from '../../internal/utils';

/**
 * Cells are the elements of the graph model. They represent the state
 * of the groups, vertices and edges in a graph.
 *
 * ### Custom attributes
 * For custom attributes we recommend using an XML node as the value of a cell.
 * The following code can be used to create a cell with an XML node as the value:
 * ```javascript
 * const doc = xmlUtils.createXmlDocument();
 * const node = doc.createElement('MyNode')
 * node.setAttribute('label', 'MyLabel');
 * node.setAttribute('attribute1', 'value1');
 * graph.insertVertex(graph.getDefaultParent(), null, node, 40, 40, 80, 30);
 * ```
 *
 * For the label to work, {@link graph.convertValueToString} and
 * {@link graph.cellLabelChanged} should be overridden as follows:
 *
 * ```javascript
 * graph.convertValueToString(cell) {
 *   if (domUtils.isNode(cell.value)) {
 *     return cell.getAttribute('label', '')
 *   }
 * };
 *
 * const cellLabelChanged = graph.cellLabelChanged;
 * graph.cellLabelChanged(cell, newValue, autoSize) {
 *   if (domUtils.isNode(cell.value)) {
 *     // Clones the value for correct undo/redo
 *     const elt = cell.value.cloneNode(true);
 *     elt.setAttribute('label', newValue);
 *     newValue = elt;
 *   }
 *
 *   cellLabelChanged.apply(this, arguments);
 * };
 * ```
 */
export class Cell implements IdentityObject {
  constructor(
    value: any = null,
    geometry: Geometry | null = null,
    style: CellStyle = {}
  ) {
    this.value = value;
    this.setGeometry(geometry);
    this.setStyle(style);
    if (this.onInit) {
      this.onInit();
    }
  }

  // TODO: Document me!!!
  getChildren(): Cell[] {
    return this.children || [];
  }

  // TODO: Document me!
  // used by invalidate() of GraphView
  invalidating = false;

  onInit: (() => void) | null = null;

  // used by addCellOverlay() of mxGraph
  overlays: CellOverlay[] = [];

  /**
   * Holds the identifier of the Cell.
   * @default null
   */
  id: string | null = null;

  /**
   * Holds the user object.
   * @default null
   */
  value: any = null;

  /**
   * Holds the {@link Geometry}.
   * @default null
   */
  geometry: Geometry | null = null;

  /**
   * Holds the style of the Cell.
   * @default {}
   */
  style: CellStyle = {};

  /**
   * Specifies whether the cell is a vertex.
   * @default false
   */
  vertex = false;

  /**
   * Specifies whether the cell is an edge.
   * @default false
   */
  edge = false;

  /**
   * Specifies whether the cell is connectable.
   * @default true
   */
  connectable = true;

  /**
   * Specifies whether the cell is visible.
   * @default true
   */
  visible = true;

  /**
   * Specifies whether the cell is collapsed.
   * @default false
   */
  collapsed = false;

  /**
   * Reference to the parent cell.
   * @default null
   */
  parent: Cell | null = null;

  /**
   * Reference to the source terminal.
   * @default null
   */
  source: Cell | null = null;

  /**
   * Reference to the target terminal.
   * @default null
   */
  target: Cell | null = null;

  /**
   * Holds the child cells.
   * @default []
   */
  children: Cell[] = [];

  /**
   * Holds the edges.
   * @default []
   */
  edges: Cell[] = [];

  /**
   * List of members that should not be cloned inside {@link clone}. This field is
   * passed to {@link utils.clone} and is not made persistent in {@link CellCodec}.
   * This is not a convention for all classes, it is only used in this class
   * to mark transient fields since transient modifiers are not supported by
   * the language.
   */
  mxTransient: string[] = [
    'id',
    'value',
    'parent',
    'source',
    'target',
    'children',
    'edges',
  ];

  /**
   * Returns the Id of the cell as a string.
   */
  getId(): string | null {
    return this.id;
  }

  /**
   * Sets the Id of the cell to the given string.
   */
  setId(id: string): void {
    this.id = id;
  }

  /**
   * Returns the user object of the cell. The user
   * object is stored in <value>.
   */
  getValue(): any {
    return this.value;
  }

  /**
   * Sets the user object of the cell. The user object
   * is stored in <value>.
   */
  setValue(value: any): void {
    this.value = value;
  }

  /**
   * Changes the user object after an in-place edit
   * and returns the previous value. This implementation
   * replaces the user object with the given value and
   * returns the old user object.
   */
  valueChanged(newValue: any): any {
    const previous = this.getValue();
    this.setValue(newValue);
    return previous;
  }

  /**
   * Returns the {@link Geometry} that describes the <geometry>.
   */
  getGeometry(): Geometry | null {
    return this.geometry;
  }

  /**
   * Sets the {@link Geometry} to be used as the <geometry>.
   */
  setGeometry(geometry: Geometry | null) {
    this.geometry = geometry;
  }

  /**
   * Returns a string that describes the {@link style}.
   *
   * **IMPORTANT**: if you want to get the style object to later update it and propagate changes to the view, use {@link getClonedStyle} instead.
   */
  getStyle() {
    return this.style;
  }

  /**
   * Use this method to get the style object to later update it and propagate changes to the view.
   *
   * See {@link GraphDataModel.setStyle} for more details.
   */
  getClonedStyle(): CellStyle {
    return clone(this.getStyle());
  }

  /**
   * Sets the string to be used as the {@link style}.
   */
  setStyle(style: CellStyle) {
    this.style = style;
  }

  /**
   * Returns true if the cell is a vertex.
   */
  isVertex(): boolean {
    return this.vertex;
  }

  /**
   * Specifies if the cell is a vertex. This should only be assigned at
   * construction of the cell and not be changed during its lifecycle.
   *
   * @param vertex Boolean that specifies if the cell is a vertex.
   */
  setVertex(vertex: boolean): void {
    this.vertex = vertex;
  }

  /**
   * Returns true if the cell is an edge.
   */
  isEdge(): boolean {
    return this.edge;
  }

  /**
   * Specifies if the cell is an edge. This should only be assigned at
   * construction of the cell and not be changed during its lifecycle.
   *
   * @param edge Boolean that specifies if the cell is an edge.
   */
  setEdge(edge: boolean): void {
    this.edge = edge;
  }

  /**
   * Returns true if the cell is connectable.
   */
  isConnectable(): boolean {
    return this.connectable;
  }

  /**
   * Sets the connectable state.
   *
   * @param connectable Boolean that specifies the new connectable state.
   */
  setConnectable(connectable: boolean): void {
    this.connectable = connectable;
  }

  /**
   * Returns true if the cell is visibile.
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Specifies if the cell is visible.
   *
   * @param visible Boolean that specifies the new visible state.
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Returns true if the cell is collapsed.
   */
  isCollapsed(): boolean {
    return this.collapsed;
  }

  /**
   * Sets the collapsed state.
   *
   * @param collapsed Boolean that specifies the new collapsed state.
   */
  setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
  }

  /**
   * Returns the cell's parent.
   */
  getParent() {
    return this.parent;
  }

  /**
   * Sets the parent cell.
   *
   * @param parent<Cell> that represents the new parent.
   */
  setParent(parent: Cell | null) {
    this.parent = parent;
  }

  /**
   * Returns the source or target terminal.
   *
   * @param source Boolean that specifies if the source terminal should be
   * returned.
   */
  getTerminal(source = false) {
    return source ? this.source : this.target;
  }

  /**
   * Sets the source or target terminal and returns the new terminal.
   *
   * @param terminal  Cell that represents the new source or target terminal.
   * @param isSource  boolean that specifies if the source or target terminal should be set.
   */
  setTerminal(terminal: Cell | null, isSource: boolean) {
    if (isSource) {
      this.source = terminal;
    } else {
      this.target = terminal;
    }

    return terminal;
  }

  /**
   * Returns the number of child cells.
   */
  getChildCount(): number {
    return this.children.length;
  }

  /**
   * Returns the index of the specified child in the child array.
   *
   * @param child Child whose index should be returned.
   */
  getIndex(child: Cell | null) {
    if (child === null) return -1;
    return this.children.indexOf(child);
  }

  /**
   * Returns the child at the specified index.
   *
   * @param indexInteger that specifies the child to be returned.
   */
  getChildAt(index: number): Cell {
    return this.children[index];
  }

  /**
   * Inserts the specified child into the child array at the specified index
   * and updates the parent reference of the child. If not childIndex is
   * specified then the child is appended to the child array. Returns the
   * inserted child.
   *
   * @param child<Cell> to be inserted or appended to the child array.
   * @param indexOptional integer that specifies the index at which the child
   * should be inserted into the child array.
   */
  insert(child: Cell, index?: number): Cell | null {
    if (index === undefined) {
      index = this.getChildCount();

      if (child.getParent() === this) {
        index--;
      }
    }

    child.removeFromParent();
    child.setParent(this);

    this.children.splice(index, 0, child);

    return child;
  }

  /**
   * Removes the child at the specified index from the child array and
   * returns the child that was removed. Will remove the parent reference of
   * the child.
   *
   * @param indexInteger that specifies the index of the child to be
   * removed.
   */
  remove(index: number): Cell | null {
    let child = null;

    if (index >= 0) {
      child = this.getChildAt(index);
      if (child) {
        this.children.splice(index, 1);
        child.setParent(null);
      }
    }

    return child;
  }

  /**
   * Removes the cell from its parent.
   */
  removeFromParent(): void {
    if (this.parent) {
      const index = this.parent.getIndex(this);
      this.parent.remove(index);
    }
  }

  /**
   * Returns the number of edges in the edge array.
   */
  getEdgeCount() {
    return this.edges.length;
  }

  /**
   * Returns the index of the specified edge in <edges>.
   *
   * @param edge<Cell> whose index in <edges> should be returned.
   */
  getEdgeIndex(edge: Cell) {
    return this.edges.indexOf(edge);
  }

  /**
   * Returns the edge at the specified index in <edges>.
   *
   * @param indexInteger that specifies the index of the edge to be returned.
   */
  getEdgeAt(index: number) {
    return this.edges[index];
  }

  /**
   * Inserts the specified edge into the edge array and returns the edge.
   * Will update the respective terminal reference of the edge.
   *
   * @param edge              <Cell> to be inserted into the edge array.
   * @param isOutgoing Boolean that specifies if the edge is outgoing.
   */
  insertEdge(edge: Cell, isOutgoing = false) {
    edge.removeFromTerminal(isOutgoing);
    edge.setTerminal(this, isOutgoing);

    if (
      this.edges.length === 0 ||
      edge.getTerminal(!isOutgoing) !== this ||
      this.edges.indexOf(edge) < 0
    ) {
      this.edges.push(edge);
    }

    return edge;
  }

  /**
   * Removes the specified edge from the edge array and returns the edge.
   * Will remove the respective terminal reference from the edge.
   *
   * @param edge<Cell> to be removed from the edge array.
   * @param isOutgoing Boolean that specifies if the edge is outgoing.
   */
  removeEdge(edge: Cell | null, isOutgoing = false): Cell | null {
    if (edge != null) {
      if (edge.getTerminal(!isOutgoing) !== this && this.edges != null) {
        const index = this.getEdgeIndex(edge);

        if (index >= 0) {
          this.edges.splice(index, 1);
        }
      }
      edge.setTerminal(null, isOutgoing);
    }
    return edge;
  }

  /**
   * Removes the edge from its source or target terminal.
   *
   * @param isSource Boolean that specifies if the edge should be removed from its source or target terminal.
   */
  removeFromTerminal(isSource: boolean): void {
    const terminal = this.getTerminal(isSource);

    if (terminal) {
      terminal.removeEdge(this, isSource);
    }
  }

  /**
   * Returns true if the user object is an XML node that contains the given attribute.
   *
   * @param name Name nameName of the attribute.
   */
  hasAttribute(name: string): boolean {
    const userObject: UserObject = this.getValue();

    return isElement(userObject) && userObject.hasAttribute
      ? userObject.hasAttribute(name)
      : !isNullish(userObject.getAttribute?.(name));
  }

  /**
   * Returns the specified attribute from the user object if it is an XML node.
   *
   * @param name Name of the attribute whose value should be returned.
   * @param defaultValue Optional default value to use if the attribute has no
   * value.
   */
  getAttribute(name: string, defaultValue?: any): any {
    const userObject: UserObject = this.getValue();
    const val = isElement(userObject) ? userObject.getAttribute?.(name) : null;

    return val ?? defaultValue;
  }

  /**
   * Sets the specified attribute on the user object if it is an XML node.
   *
   * @param name Name of the attribute whose value should be set.
   * @param value New value of the attribute.
   */
  setAttribute(name: string, value: any): void {
    const userObject: UserObject = this.getValue();

    if (isElement(userObject)) {
      userObject.setAttribute?.(name, value);
    }
  }

  /**
   * Returns a clone of the cell.
   *
   * Uses {@link cloneValue} to clone the user object.
   *
   * All fields in {@link mxTransient} are ignored during the cloning.
   */
  clone(): Cell {
    const c = clone(this, this.mxTransient);
    c.setValue(this.cloneValue());
    return c;
  }

  /**
   * Returns a clone of the cell's user object.
   */
  cloneValue(): any {
    let value: UserObject = this.getValue();
    if (!isNullish(value)) {
      if (typeof value.clone === 'function') {
        value = value.clone();
      } else if (!isNullish(value.nodeType) && value.cloneNode) {
        value = value.cloneNode(true);
      }
    }
    return value;
  }

  /**
   * Returns the nearest common ancestor for the specified cells to `this`.
   *
   * @param {Cell} cell2  that specifies the second cell in the tree.
   */
  getNearestCommonAncestor(cell2: Cell): Cell | null {
    // Creates the cell path for the second cell
    let path = CellPath.create(cell2);

    if (path.length > 0) {
      // Bubbles through the ancestors of the first cell to find the nearest common ancestor.
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- we need to use `this` to refer to the instance to start processing
      let cell: Cell | null = this;
      let current: string | null = CellPath.create(cell);

      // Inverts arguments
      if (path.length < current.length) {
        cell = cell2;
        const tmp = current;
        current = path;
        path = tmp;
      }

      while (cell && current) {
        const parent: Cell | null = cell.getParent();

        // Checks if the cell path is equal to the beginning of the given cell path
        if (path.indexOf(current + CellPath.PATH_SEPARATOR) === 0 && parent) {
          return cell;
        }

        current = CellPath.getParentPath(current);
        cell = parent;
      }
    }

    return null;
  }

  /**
   * Returns true if the given parent is an ancestor of the given child. Note
   * returns true if child == parent.
   *
   * @param {Cell} child  that specifies the child.
   */
  isAncestor(child: Cell | null) {
    while (child && child !== this) {
      child = child.getParent();
    }

    return child === this;
  }

  /**
   * Returns the child vertices of the given parent.
   */
  getChildVertices() {
    return this.getChildCells(true, false);
  }

  /**
   * Returns the child edges of the given parent.
   */
  getChildEdges() {
    return this.getChildCells(false, true);
  }

  /**
   * Returns the children of the given cell that are vertices and/or edges
   * depending on the arguments.
   *
   * @param vertices  Boolean indicating if child vertices should be returned.
   * Default is false.
   * @param edges  Boolean indicating if child edges should be returned.
   * Default is false.
   */
  getChildCells(vertices = false, edges = false) {
    const childCount = this.getChildCount();
    const result = [];

    for (let i = 0; i < childCount; i += 1) {
      const child = this.getChildAt(i);

      if (
        (!edges && !vertices) ||
        (edges && child.isEdge()) ||
        (vertices && child.isVertex())
      ) {
        result.push(child);
      }
    }

    return result;
  }

  /**
   * Returns the number of incoming or outgoing edges, ignoring the given
   * edge.
   *
   * @param outgoing  Boolean that specifies if the number of outgoing or
   * incoming edges should be returned.
   * @param {Cell} ignoredEdge  that represents an edge to be ignored.
   */
  getDirectedEdgeCount(outgoing: boolean, ignoredEdge: Cell | null = null) {
    let count = 0;
    const edgeCount = this.getEdgeCount();

    for (let i = 0; i < edgeCount; i += 1) {
      const edge = this.getEdgeAt(i);
      if (edge !== ignoredEdge && edge && edge.getTerminal(outgoing) === this) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Returns all edges of the given cell without loops.
   */
  getConnections() {
    return this.getEdges(true, true, false);
  }

  /**
   * Returns the incoming edges of the given cell without loops.
   */
  getIncomingEdges() {
    return this.getEdges(true, false, false);
  }

  /**
   * Returns the outgoing edges of the given cell without loops.
   */
  getOutgoingEdges() {
    return this.getEdges(false, true, false);
  }

  /**
   * Returns all distinct edges connected to this cell as a new array of
   * {@link Cell}. If at least one of incoming or outgoing is true, then loops
   * are ignored, otherwise if both are false, then all edges connected to
   * the given cell are returned including loops.
   *
   * @param incoming  Optional boolean that specifies if incoming edges should be
   * returned. Default is true.
   * @param outgoing  Optional boolean that specifies if outgoing edges should be
   * returned. Default is true.
   * @param includeLoops  Optional boolean that specifies if loops should be returned.
   * Default is true.
   */
  getEdges(incoming = true, outgoing = true, includeLoops = true) {
    const edgeCount = this.getEdgeCount();
    const result = [];

    for (let i = 0; i < edgeCount; i += 1) {
      const edge = this.getEdgeAt(i);
      const source = edge.getTerminal(true);
      const target = edge.getTerminal(false);

      if (
        (includeLoops && source === target) ||
        (source !== target &&
          ((incoming && target === this) || (outgoing && source === this)))
      ) {
        result.push(edge);
      }
    }

    return result;
  }

  /**
   * Returns the absolute, accumulated origin for the children inside the
   * given parent as an {@link Point}.
   */
  getOrigin(): Point {
    let result = new Point();
    const parent = this.getParent();

    if (parent) {
      result = parent.getOrigin();

      if (!this.isEdge()) {
        const geo = this.getGeometry();

        if (geo) {
          result.x += geo.x;
          result.y += geo.y;
        }
      }
    }

    return result;
  }

  /**
   * Returns all descendants of the given cell and the cell itself in an array.
   */
  getDescendants() {
    return this.filterDescendants(null);
  }

  /**
   * Visits all cells recursively and applies the specified filter function
   * to each cell. If the function returns true then the cell is added
   * to the resulting array. The parent and result paramters are optional.
   * If parent is not specified then the recursion starts at {@link root}.
   *
   * Example:
   * The following example extracts all vertices from a given model:
   * ```javascript
   * var filter(cell)
   * {
   * 	return model.isVertex(cell);
   * }
   * var vertices = model.filterDescendants(filter);
   * ```
   *
   * @param filter  JavaScript function that takes an {@link Cell} as an argument
   * and returns a boolean.
   */
  filterDescendants(filter: FilterFunction | null): Cell[] {
    // Creates a new array for storing the result
    let result: Cell[] = [];

    // Checks if the filter returns true for the cell
    // and adds it to the result array
    if (filter === null || filter(this)) {
      result.push(this);
    }

    // Visits the children of the cell
    const childCount = this.getChildCount();
    for (let i = 0; i < childCount; i += 1) {
      const child = this.getChildAt(i);
      result = result.concat(child.filterDescendants(filter));
    }

    return result;
  }

  /**
   * Returns the root of the model or the topmost parent of the given cell.
   */
  getRoot() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias -- we need to use `this` to refer to the instance to start processing
    let cell: Cell | null = this;
    let root: Cell = cell;

    while (cell) {
      root = cell;
      cell = cell.getParent();
    }

    return root;
  }
}

export default Cell;
